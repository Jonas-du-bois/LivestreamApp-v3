import mongoose from 'mongoose';
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime';

import '../models/Group';
import '../models/Apparatus';
import '../models/Passage';
import '../models/Stream';
import '../models/Subscription';

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig();
  let uri = config.mongodbUri;
  const isDev = process.env.NODE_ENV !== 'production';

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // PRODUCTION SAFETY CHECK
  if (!isDev && !uri) {
    throw new Error('[db] CRITICAL: MONGODB_URI is missing in production. Application cannot start.');
  }

  // Fallback to Memory Server ONLY in Development
  if (isDev && !uri) {
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
    console.log('[db] Connecting to MongoDB...', uri);
    mongoose.connection.on('connected', () => console.log('[db] mongoose connected, readyState=', mongoose.connection.readyState));
    mongoose.connection.on('error', (e) => console.error('[db] mongoose connection error', e));
    // Use a short server selection timeout to fail fast when DB is unreachable
    await mongoose.connect(uri!, { serverSelectionTimeoutMS: 5000 });
    console.log('[db] Connected to MongoDB');
  } catch (err) {
    console.error('[db] Connection error:', err);
    // In production, we might want to exit if connection fails
    if (!isDev) {
      throw err;
    }
  }
});