import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

let retryAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDatabase = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const maskUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');

  const logConnectionInfo = () => {
    if (NODE_ENV !== 'production') {
      try {
        const uri = MONGODB_URI.replace(/\+\//, '://');
        const parsed = new URL(uri);
        console.log(`  Database host: ${parsed.hostname}`);
        console.log(`  Database name: ${parsed.pathname.replace('/', '')}`);
        console.log(`  Auth user:     ${parsed.username}`);
      } catch {
        // URI parsing failed, skip detailed logging
      }
    }
  };

  while (retryAttempts < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`  MongoDB URI:   ${maskUri(MONGODB_URI)}`);
      console.log(`  Attempt:       ${retryAttempts + 1}/${MAX_RETRY_ATTEMPTS}`);
      logConnectionInfo();

      await mongoose.connect(MONGODB_URI, connectionOptions);

      console.log('  Status:        Connected\n');
      return;
    } catch (error) {
      retryAttempts++;

      if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
        throw new Error('MongoDB authentication failed. Check username/password in MONGODB_URI.');
      }
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        throw new Error('MongoDB host not found. Check the hostname in MONGODB_URI.');
      }
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('MongoDB connection refused. Is the database accessible from this network?');
      }

      if (retryAttempts < MAX_RETRY_ATTEMPTS) {
        console.warn(`  Connection failed: ${error.message}`);
        console.warn(`  Retrying in ${RETRY_DELAY_MS / 1000}s...\n`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new Error(`Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`);
      }
    }
  }
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

export const isConnected = () => mongoose.connection.readyState === 1;

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

export default mongoose;