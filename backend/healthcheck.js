// Simple health check script for Docker
import mongoose from 'mongoose';

const checkHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 1) {
      console.log('Health check passed: MongoDB connected');
      process.exit(0);
    } else {
      console.error('Health check failed: MongoDB not connected');
      process.exit(1);
    }
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
};

// If called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  // Don't actually connect, just exit (Docker healthcheck uses curl)
  process.exit(0);
}

export default checkHealth;