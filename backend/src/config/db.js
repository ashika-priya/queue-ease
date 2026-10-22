const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/queue_ease';
  
  try {
    // Attempt connecting to the primary configured MongoDB instance
    console.log(`[DB] Attempting connection to MongoDB: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    console.log('[DB] Connected successfully to Primary MongoDB daemon.');
    return mongoose.connection;
  } catch (primaryErr) {
    console.warn(`[DB] Primary MongoDB unavailable (${primaryErr.message}). Activating Resilient Dual-Mode In-Memory Engine...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017, // Try to bind standard port if available
          dbName: 'queue_ease'
        }
      }).catch(async () => {
        // If 27017 port in use, create with dynamic port
        return await MongoMemoryServer.create({
          instance: { dbName: 'queue_ease' }
        });
      });

      const memUri = mongodInstance.getUri();
      console.log(`[DB] In-Memory MongoDB Server initialized at: ${memUri}`);
      await mongoose.connect(memUri);
      console.log('[DB] Connected successfully to In-Memory MongoDB instance (100% Mongoose compliant).');
      return mongoose.connection;
    } catch (memErr) {
      console.error('[DB] Failed to launch In-Memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[DB] Error during disconnect:', err.message);
  }
};

module.exports = { connectDB, closeDB };
