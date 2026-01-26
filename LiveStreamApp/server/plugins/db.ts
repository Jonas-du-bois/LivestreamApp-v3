import mongoose from 'mongoose';

export default defineNitroPlugin(async () => {
  const { mongodbUri } = useRuntimeConfig();

  if (!mongodbUri) {
    console.error('[db] Missing `mongodbUri` in runtime config. Skipping MongoDB connection.');
    return;
  }

  // Avoid multiple connections in dev/hot-reload
  if (mongoose.connection.readyState >= 1) {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    console.log(`[db] MongoDB already connected (state=${mongoose.connection.readyState}).`);
    return;
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongodbUri as string, {} as mongoose.ConnectOptions);
    console.log('[db] Connected to MongoDB');
  } catch (error) {
    // Handle connection failure gracefully
    // Do not crash the server — log the error for operators to investigate
    // Future: consider retry/backoff logic if desired
    console.error('[db] MongoDB connection error:', error);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error (event):', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
});