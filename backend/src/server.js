import 'dotenv/config';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { validateEnv } from './config/env.js';
import { seedDatabase } from './seed/seedDatabase.js';

const PORT = parseInt(process.env.PORT, 10) || 5000;

let server = null;

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const startServer = async () => {
  try {
    if (!validateEnv()) {
      process.exit(1);
    }

    console.log('\n--- Startup ---');
    console.log(`  Port:     ${PORT}`);
    console.log(`  Node env: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Time:     ${new Date().toISOString()}\n`);

    await connectDatabase();
    console.log('MongoDB Connected\n');

    await seedDatabase({ onlyIfEmpty: true });

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
      }
      if (err.code === 'EACCES') {
        console.error(`Permission denied on port ${PORT}.`);
        process.exit(1);
      }
      console.error('Server error:', err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('\nFailed to start server:', err.message);
    process.exit(1);
  }
};

startServer();