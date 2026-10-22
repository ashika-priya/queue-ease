const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Indian 10-digit mobile number validation: Starts with 6, 7, 8, or 9 and has 10 digits
const isValidIndianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (phone && !isValidIndianPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile phone number. Please enter a valid 10-digit Indian mobile number starting with 6-9.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone ? String(phone).replace(/\D/g, '') : '',
      role: role && ['customer', 'staff', 'admin'].includes(role) ? role : 'customer',
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed due to a server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('organizationId')
      .populate('counterId');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        counterId: user.counterId,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed due to a server error.' });
  }
};

exports.quickDemoLogin = async (req, res) => {
  try {
    const { role, email } = req.body;

    let targetEmail = '';
    if (email) {
      targetEmail = email.toLowerCase();
    } else if (role === 'customer') {
      targetEmail = 'shankar@example.com';
    } else if (role === 'staff') {
      targetEmail = 'sarah@citycare.com';
    } else if (role === 'admin') {
      targetEmail = 'eleanor@queueease.com';
    } else {
      return res.status(400).json({ success: false, message: 'Valid demo role or email required.' });
    }

    let user = await User.findOne({ email: targetEmail })
      .populate('organizationId')
      .populate('counterId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Demo user for ${targetEmail} not found. Please ensure database is seeded.`,
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Signed in as demo ${user.role} (${user.name}).`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        counterId: user.counterId,
      },
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ success: false, message: 'Demo sign-in failed.' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash')
      .populate('organizationId')
      .populate('counterId');

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};
