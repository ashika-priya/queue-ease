const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');
const Notification = require('../models/Notification');

async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing old records...');

    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Service.deleteMany({}),
      Counter.deleteMany({}),
      Queue.deleteMany({}),
      QueueEntry.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo organizations...');
    const cityCare = await Organization.create({
      name: 'CityCare Hospital',
      type: 'Hospital',
      tagline: 'Compassionate Care, Seamless Experience',
      address: '104 Healthway Blvd, Chennai',
      contact: '+91 44 2819 0000',
      status: 'active',
    });

    const apexBank = await Organization.create({
      name: 'Apex Global Bank',
      type: 'Bank',
      tagline: 'Next-Gen Banking at Your Fingertips',
      address: '42 Financial Plaza, Chennai',
      contact: '+91 44 2433 1122',
      status: 'active',
    });

    const quickFix = await Organization.create({
      name: 'QuickFix Tech Service Center',
      type: 'Service Center',
      tagline: 'Fast Hardware & Electronics Support',
      address: '12 Silicon Arcade, Chennai',
      contact: '+91 44 2855 3344',
      status: 'active',
    });

    console.log('[Seed] Creating services for CityCare Hospital...');
    const genConsult = await Service.create({
      organizationId: cityCare._id,
      name: 'General Consultation',
      description: 'Outpatient consultation and general physician diagnostics',
      averageServiceTime: 6,
      prefix: 'Q',
      status: 'active',
    });

    const pharmacy = await Service.create({
      organizationId: cityCare._id,
      name: 'Pharmacy',
      description: 'Prescription dispensing and wellness medicine',
      averageServiceTime: 4,
      prefix: 'PH',
      status: 'active',
    });

    const lab = await Service.create({
      organizationId: cityCare._id,
      name: 'Laboratory',
      description: 'Phlebotomy, pathology, blood work, diagnostic imaging',
      averageServiceTime: 8,
      prefix: 'LAB',
      status: 'active',
    });

    const billing = await Service.create({
      organizationId: cityCare._id,
      name: 'Billing',
      description: 'Insurance authorization and payment processing',
      averageServiceTime: 3,
      prefix: 'BIL',
      status: 'active',
    });

    const registration = await Service.create({
      organizationId: cityCare._id,
      name: 'Registration',
      description: 'Appointments, in-patient booking, records verification',
      averageServiceTime: 5,
      prefix: 'REG',
      status: 'active',
    });

    console.log('[Seed] Creating services for Apex Global Bank...');
    await Service.create([
      {
        organizationId: apexBank._id,
        name: 'Cash & Teller Counter',
        description: 'Cash deposits, withdrawals, and draft issuance',
        averageServiceTime: 4,
        prefix: 'CSH',
        status: 'active',
      },
      {
        organizationId: apexBank._id,
        name: 'Loan & Mortgages',
        description: 'Home, vehicle, and commercial credit consulting',
        averageServiceTime: 15,
        prefix: 'LN',
        status: 'active',
      },
      {
        organizationId: apexBank._id,
        name: 'Account Services',
        description: 'KYC updates, net banking, debit cards',
        averageServiceTime: 8,
        prefix: 'ACC',
        status: 'active',
      },
    ]);

    console.log('[Seed] Creating services for QuickFix Tech...');
    await Service.create([
      {
        organizationId: quickFix._id,
        name: 'Diagnostics & Triage',
        description: 'Hardware failure inspection & rapid intake',
        averageServiceTime: 10,
        prefix: 'DIAG',
        status: 'active',
      },
      {
        organizationId: quickFix._id,
        name: 'Device Repair Handover',
        description: 'Completed hardware testing and warranty collection',
        averageServiceTime: 7,
        prefix: 'REP',
        status: 'active',
      },
      {
        organizationId: quickFix._id,
        name: 'Accessories & Parts',
        description: 'Original spare parts and upgrade inquiries',
        averageServiceTime: 3,
        prefix: 'PRT',
        status: 'active',
      },
    ]);

    console.log('[Seed] Creating counters for CityCare...');
    const counter1 = await Counter.create({
      organizationId: cityCare._id,
      serviceId: genConsult._id,
      counterNumber: '1',
      name: 'Counter 1 - General Consultation',
      status: 'open',
    });

    const counter2 = await Counter.create({
      organizationId: cityCare._id,
      serviceId: genConsult._id,
      counterNumber: '2',
      name: 'Counter 2 - General Consultation',
      status: 'open',
    });

    await Counter.create([
      {
        organizationId: cityCare._id,
        serviceId: pharmacy._id,
        counterNumber: '3',
        name: 'Counter 3 - Pharmacy Dispensing',
        status: 'open',
      },
      {
        organizationId: cityCare._id,
        serviceId: lab._id,
        counterNumber: '4',
        name: 'Counter 4 - Diagnostic Phlebotomy',
        status: 'open',
      },
      {
        organizationId: cityCare._id,
        serviceId: billing._id,
        counterNumber: '5',
        name: 'Counter 5 - Billing Desk',
        status: 'open',
      },
    ]);

    console.log('[Seed] Creating users (Shankar, Dr. Sarah Patel, Eleanor Vance)...');
    const defaultPassword = 'secret123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const shankar = await User.create({
      name: 'Shankar',
      email: 'shankar@example.com',
      passwordHash,
      phone: '9876543210',
      role: 'customer',
    });

    const drSarah = await User.create({
      name: 'Dr. Sarah Patel',
      email: 'sarah@citycare.com',
      passwordHash,
      phone: '9876543211',
      role: 'staff',
      organizationId: cityCare._id,
      counterId: counter1._id,
    });

    counter1.currentStaffId = drSarah._id;
    await counter1.save();

    const eleanor = await User.create({
      name: 'Eleanor Vance',
      email: 'eleanor@queueease.com',
      passwordHash,
      phone: '9876543212',
      role: 'admin',
      organizationId: cityCare._id,
    });

    console.log('[Seed] Creating active queue & entries for General Consultation...');
    const today = new Date().toISOString().slice(0, 10);
    const genQueue = await Queue.create({
      organizationId: cityCare._id,
      serviceId: genConsult._id,
      date: today,
      status: 'active',
      currentToken: 'Q-018',
      currentCounterId: counter1._id,
      lastIssuedNumber: 24,
      completedDurations: [6, 5, 7, 6, 6],
    });

    // Completed earlier today
    for (let i = 15; i <= 17; i++) {
      const pad = String(i).padStart(3, '0');
      await QueueEntry.create({
        queueId: genQueue._id,
        customerName: `Visitor ${pad}`,
        customerPhone: `98765000${pad}`,
        tokenNumber: `Q-${pad}`,
        sequenceNumber: i,
        status: 'completed',
        counterId: counter1._id,
        servedByStaffId: drSarah._id,
        joinedAt: new Date(Date.now() - (30 - i) * 15 * 60000),
        calledAt: new Date(Date.now() - (25 - i) * 12 * 60000),
        completedAt: new Date(Date.now() - (20 - i) * 10 * 60000),
      });
    }

    // Now Calling Q-018 at Counter 1
    await QueueEntry.create({
      queueId: genQueue._id,
      customerName: 'Arun Kumar',
      customerPhone: '9876500018',
      tokenNumber: 'Q-018',
      sequenceNumber: 18,
      status: 'calling',
      counterId: counter1._id,
      servedByStaffId: drSarah._id,
      notes: 'Follow-up consultation',
      joinedAt: new Date(Date.now() - 40 * 60000),
      calledAt: new Date(Date.now() - 3 * 60000),
    });

    // Waiting queue: Q-019 to Q-024
    const waitingNames = [
      { name: 'Kavitha R', phone: '9876500019', notes: 'Routine blood pressure check' },
      { name: 'Mohammed Tariq', phone: '9876500020', notes: 'Fever and cold evaluation' },
      { name: 'Priya Sharma', phone: '9876500021', notes: 'General wellness checkup' },
      { name: 'David Raj', phone: '9876500022', notes: 'Prescription renewal' },
      { name: 'Sneha Patel', phone: '9876500023', notes: 'Allergy consultation' },
    ];

    for (let i = 0; i < waitingNames.length; i++) {
      const seq = 19 + i;
      const pad = String(seq).padStart(3, '0');
      await QueueEntry.create({
        queueId: genQueue._id,
        customerName: waitingNames[i].name,
        customerPhone: waitingNames[i].phone,
        tokenNumber: `Q-${pad}`,
        sequenceNumber: seq,
        status: 'waiting',
        notes: waitingNames[i].notes,
        joinedAt: new Date(Date.now() - (20 - i) * 3 * 60000),
      });
    }

    // Shankar's ticket: Q-024 (5 people ahead: Q-019, 20, 21, 22, 23)
    await QueueEntry.create({
      queueId: genQueue._id,
      customerId: shankar._id,
      customerName: 'Shankar',
      customerPhone: '9876543210',
      tokenNumber: 'Q-024',
      sequenceNumber: 24,
      status: 'waiting',
      notes: 'Chest discomfort and seasonal cough',
      joinedAt: new Date(Date.now() - 5 * 60000),
    });

    // Also seed a couple tickets in Pharmacy and Apex Bank for multi-department analytics
    const pharmQueue = await Queue.create({
      organizationId: cityCare._id,
      serviceId: pharmacy._id,
      date: today,
      status: 'active',
      currentToken: 'PH-005',
      lastIssuedNumber: 8,
    });

    for (let p = 6; p <= 8; p++) {
      await QueueEntry.create({
        queueId: pharmQueue._id,
        customerName: `Pharmacy Patron ${p}`,
        customerPhone: `987660000${p}`,
        tokenNumber: `PH-00${p}`,
        sequenceNumber: p,
        status: 'waiting',
        joinedAt: new Date(),
      });
    }

    console.log('[Seed] Seeding completed successfully!');
    console.log('Demo Accounts:');
    console.log('  Customer: shankar@example.com / secret123 (Active Token: Q-024)');
    console.log('  Staff:    sarah@citycare.com   / secret123 (Dr. Sarah Patel, Counter 1)');
    console.log('  Admin:    eleanor@queueease.com / secret123 (Eleanor Vance)');

    if (require.main === module) {
      await closeDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
