const Organization = require('../models/Organization');
const Service = require('../models/Service');

exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({ status: 'active' }).sort({ createdAt: 1 });
    return res.json({ success: true, organizations: orgs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch organizations' });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    return res.json({ success: true, organization: org });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch organization' });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, type, address, contact, tagline } = req.body;
    const org = await Organization.create({
      name,
      type,
      address,
      contact,
      tagline,
    });
    return res.status(201).json({ success: true, organization: org });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create organization' });
  }
};
