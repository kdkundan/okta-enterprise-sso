/**
 * MongoDB connection via Mongoose.
 * Implements exponential-backoff retry so the app recovers from
 * transient network or container startup issues.
 */

import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

let retryCount = 0;

const connect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(uri, {
      // These are the recommended settings for production Mongoose 8+
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    retryCount = 0; // reset on successful connect
    console.log(`[DB] Connected to MongoDB: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
  } catch (err) {
    retryCount += 1;
    const delay = RETRY_DELAY_MS * retryCount;

    if (retryCount > MAX_RETRIES) {
      console.error('[DB] Max retry attempts reached. Exiting.');
      process.exit(1);
    }

    console.warn(`[DB] Connection failed (attempt ${retryCount}/${MAX_RETRIES}). Retrying in ${delay}ms...`);
    console.warn(`[DB] Error: ${err.message}`);

    setTimeout(connect, delay);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected. Attempting reconnect...');
  // Mongoose auto-reconnects by default; log for visibility
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] Mongoose error:', err.message);
});

export default connect;
