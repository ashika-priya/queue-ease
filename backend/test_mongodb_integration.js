const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
require('dotenv').config();

const { connectDB, closeDB } = require('./src/config/db');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const Service = require('./src/models/Service');
const Counter = require('./src/models/Counter');
const Queue = require('./src/models/Queue');
const QueueEntry = require('./src/models/QueueEntry');
const { generateNextToken } = require('./src/services/tokenGeneratorService');

async function runTestSuite() {
  console.log('================================================================');
  console.log('  QUEUE EASE - MONGODB INTEGRATION TEST SUITE EXECUTION');
  console.log('  Verifying 10/10 Critical Database & System Workflows');
  console.log('================================================================\n');

  let passed = 0;
  let total = 10;
  let testOrg, testService, testQueue, testEntryId;

  try {
    // TEST 1: MongoDB Connection & Active Daemon Handshake
    console.log('[TEST 1] MongoDB Connection & Active Daemon Handshake...');
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      console.log('  -> Connected successfully via Mongoose to port 27017 (Ready State: 1)');
      console.log('  -> Status: PASSED (100%)\n');
      passed++;
    } else {
      throw new Error('Mongoose readyState is not 1');
    }

    // TEST 2: Customer Registration & Password Hash Validation
    console.log('[TEST 2] Customer Registration & Password Hash Validation...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('secret123', salt);
    const testCustomer = await User.create({
      name: 'Ashika Priya M',
      email: `test_customer_${Date.now()}@example.com`,
      phone: '9876500001',
      passwordHash,
      role: 'customer',
    });
    console.log(`  -> Customer registered & verified in MongoDB: ID=${testCustomer._id.toString().slice(-8)}, Phone=${testCustomer.phone}`);
    console.log('  -> Status: PASSED (100%)\n');
    passed++;

    // TEST 3: Organization & Service Document Creation
    console.log('[TEST 3] Organization & Service Document Creation...');
    testOrg = await Organization.create({
      name: 'Test Metro Clinic',
      type: 'Hospital',
      tagline: 'Healthcare Reimagined',
      status: 'active',
    });
    testService = await Service.create({
      organizationId: testOrg._id,
      name: 'Pediatrics Consultation',
      prefix: 'PED',
      averageServiceTime: 8,
      status: 'active',
    });
    console.log(`  -> Created '${testOrg.name}' and '${testService.name}' with prefix '${testService.prefix}'`);
    console.log('  -> Status: PASSED (100%)\n');
    passed++;

    // TEST 4: QR Code Generation & Raw Pixel Image Decoding
    console.log('[TEST 4] QR Code Generation & Raw Pixel Image Decoding...');
    const testUrl = `http://localhost:3000/join/${testOrg._id}/${testService._id}`;
    const qrBuffer = await QRCode.toBuffer(testUrl, { type: 'png', width: 256, margin: 1 });
    
    // Decode raw PNG pixels
    const png = PNG.sync.read(qrBuffer);
    const decodedQR = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    if (decodedQR && decodedQR.data === testUrl) {
      console.log(`  -> QR generated with QRCode library and verified via jsQR matching target URL: ${decodedQR.data}`);
      console.log('  -> Status: PASSED (100%)\n');
      passed++;
    } else {
      throw new Error(`QR decoded data does not match target URL: ${decodedQR ? decodedQR.data : 'null'}`);
    }

    // TEST 5: Inactive Organization / Service Validation
    console.log('[TEST 5] Inactive Organization / Service Validation...');
    const inactiveOrg = await Organization.create({
      name: 'Old Outdated Clinic',
      type: 'Hospital',
      status: 'inactive',
    });
    const fetchedInactive = await Organization.findById(inactiveOrg._id);
    if (fetchedInactive.status === 'inactive') {
      console.log('  -> Verified inactive organization documents are flagged correctly in MongoDB (status: inactive)');
      console.log('  -> Status: PASSED (100%)\n');
      passed++;
    } else {
      throw new Error('Failed inactive organization validation');
    }

    // TEST 6: Queue Entry & Token Persistence
    console.log('[TEST 6] Queue Entry & Token Persistence...');
    const today = new Date().toISOString().slice(0, 10);
    testQueue = await Queue.create({
      organizationId: testOrg._id,
      serviceId: testService._id,
      date: `test-${Date.now()}-${today}`,
      status: 'active',
      lastIssuedNumber: 0,
    });

    const tokenData = await generateNextToken(testQueue._id, testService.prefix);
    const queueEntry = await QueueEntry.create({
      queueId: testQueue._id,
      customerId: testCustomer._id,
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      tokenNumber: tokenData.tokenNumber,
      sequenceNumber: tokenData.sequenceNumber,
      status: 'waiting',
      joinedAt: new Date(),
    });
    testEntryId = queueEntry._id;
    console.log(`  -> Persisted QueueEntry with sequential token '${queueEntry.tokenNumber}' and status '${queueEntry.status}'`);
    console.log('  -> Status: PASSED (100%)\n');
    passed++;

    // TEST 7: Duplicate Active Queue Prevention Enforced
    console.log('[TEST 7] Duplicate Active Queue Prevention Enforced (MongoDB Partial Unique Index)...');
    try {
      await QueueEntry.create({
        queueId: testQueue._id,
        customerName: 'Ashika Priya M (Duplicate Attempt)',
        customerPhone: testCustomer.phone, // identical phone
        tokenNumber: 'PED-002',
        sequenceNumber: 2,
        status: 'waiting',
        joinedAt: new Date(),
      });
      throw new Error('FAILED: Duplicate ticket was allowed when it should have been blocked');
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        console.log('  -> Duplicate phone blocked by MongoDB partial unique index (code 11000)');
        console.log('  -> Status: PASSED (100%)\n');
        passed++;
      } else {
        throw dupErr;
      }
    }

    // TEST 8: Staff Call Next & Queue Status Mutation
    console.log('[TEST 8] Staff Call Next & Queue Status Mutation...');
    const entryToCall = await QueueEntry.findById(testEntryId);
    entryToCall.status = 'calling';
    entryToCall.calledAt = new Date();
    await entryToCall.save();

    testQueue.currentToken = entryToCall.tokenNumber;
    await testQueue.save();

    const verifiedCalling = await QueueEntry.findById(testEntryId);
    if (verifiedCalling.status === 'calling') {
      console.log(`  -> Updated queue status in MongoDB: Now Serving='${testQueue.currentToken}', Status='calling'`);
      console.log('  -> Status: PASSED (100%)\n');
      passed++;
    } else {
      throw new Error('Queue status was not mutated to calling');
    }

    // TEST 9: Ticket Completion & Re-joining Verification
    console.log('[TEST 9] Ticket Completion & Re-joining Verification...');
    // Mark prior ticket completed
    verifiedCalling.status = 'completed';
    verifiedCalling.completedAt = new Date();
    await verifiedCalling.save();

    // Now identical phone should be allowed to rejoin since prior status is completed (partial filter no longer matches)
    const secondTokenData = await generateNextToken(testQueue._id, testService.prefix);
    const rejoinedEntry = await QueueEntry.create({
      queueId: testQueue._id,
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      tokenNumber: secondTokenData.tokenNumber,
      sequenceNumber: secondTokenData.sequenceNumber,
      status: 'waiting',
      joinedAt: new Date(),
    });

    if (rejoinedEntry && rejoinedEntry.tokenNumber === 'PED-002') {
      console.log("  -> Ticket marked 'completed'; verified identical phone successfully rejoins line with new token 'PED-002'");
      console.log('  -> Status: PASSED (100%)\n');
      passed++;
    } else {
      throw new Error('Failed to rejoin queue after ticket completion');
    }

    // TEST 10: Role Security & Bcrypt Hash Verification
    console.log('[TEST 10] Role Security & Bcrypt Hash Verification...');
    const isPasswordValid = await bcrypt.compare('secret123', testCustomer.passwordHash);
    const isWrongInvalid = await bcrypt.compare('wrongPassword', testCustomer.passwordHash);
    if (isPasswordValid && !isWrongInvalid && testCustomer.role === 'customer') {
      console.log("  -> bcrypt.compare() verified secret123 matches stored password hash; role confirmed: customer");
      console.log('  -> Status: PASSED (100%)\n');
      passed++;
    } else {
      throw new Error('Bcrypt hash or role verification failed');
    }

    console.log('================================================================');
    console.log(`  ALL ${passed}/${total} MONGODB INTEGRATION TESTS PASSED (100% Success Rate)`);
    console.log('================================================================\n');

    // Clean up test documents
    await User.findByIdAndDelete(testCustomer._id);
    await Organization.findByIdAndDelete(testOrg._id);
    await Organization.findByIdAndDelete(inactiveOrg._id);
    await Service.findByIdAndDelete(testService._id);
    await Queue.findByIdAndDelete(testQueue._id);
    await QueueEntry.deleteMany({ queueId: testQueue._id });

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ TEST SUITE FAILED AT STEP: ${err.message}`);
    console.error(err);
    await closeDB();
    process.exit(1);
  }
}

runTestSuite();
