import mongoose from 'mongoose';
import '../models/Group';
import '../models/Apparatus';
import '../models/Passage';
import '../models/Stream';
import '../models/Subscription';

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig();
  let uri = config.mongodbUri;

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // PRODUCTION SAFETY CHECK
  if (!process.dev && !uri) {
    throw new Error('[db] CRITICAL: MONGODB_URI is missing in production. Application cannot start.');
  }

  // Fallback to Memory Server ONLY in Development
  if (process.dev && !uri) {
    console.warn('[db] No MONGODB_URI provided. Starting MongoMemoryServer (Development Mode)...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('[db] MongoMemoryServer started at:', uri);
    } catch (err) {
      console.error('[db] Failed to start MongoMemoryServer.', err);
      return;
    }
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] Connected to MongoDB');
  } catch (err) {
    console.error('[db] Connection error:', err);
    // In production, we might want to exit if connection fails
    if (!process.dev) {
        throw err;
    }
  }
});
