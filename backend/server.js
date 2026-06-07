import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration - whitelist specific origins in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting - prevent DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Body size limit - prevent large payload attacks
app.use(express.json({ limit: '1mb' }));

let server = null;

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const maskUri = (uri) => {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
};

const validateEnv = () => {
  const errors = [];

  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI is required but not set');
  } else {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri.startsWith('mongodb')) {
        errors.push(`MONGODB_URI must start with 'mongodb', got '${uri.split('://')[0]}'`);
      }
      const hasUsername = uri.includes('@');
      const hasPassword = /:\/\/[^:]+:.*@/.test(uri);
      if (!hasUsername || !hasPassword) {
        errors.push('MONGODB_URI must contain username and password (format: mongodb+srv://user:pass@host/...)');
      }
    } catch {
      errors.push('MONGODB_URI is malformed');
    }
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach((e) => console.error(`  - ${e}`));
    return false;
  }
  return true;
};

const logConnectionUri = () => {
  const uri = process.env.MONGODB_URI;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const parsed = new URL(uri.replace(/\+\/\//, '://'));
    console.log(`  Database host:  ${parsed.hostname}`);
    console.log(`  Database name:  ${parsed.pathname.replace('/', '')}`);
    console.log(`  Auth user:      ${parsed.username}`);
  }
};

const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI;

  console.log('\n--- Startup ---');
  console.log(`  Port:           ${process.env.PORT || 5000}`);
  console.log(`  Node env:       ${process.env.NODE_ENV || 'development'}`);
  logConnectionUri();
  console.log(`  MongoDB URI:    ${maskUri(uri)}`);
  console.log('  Connecting...\n');

  await mongoose.connect(uri);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
};

const startServer = async () => {
  if (!validateEnv()) {
    process.exit(1);
  }

  try {
    await connectMongoDB();
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    app.use('/api', routes);

    app.get('/health', (req, res) => {
      const state = mongoose.connection.readyState;
      const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      res.json({
        status: state === 1 ? 'ok' : 'error',
        database: states[state] || 'unknown',
        uptime: `${Math.floor(process.uptime())}s`
      });
    });

    const PORT = parseInt(process.env.PORT, 10) || 5000;

    const tryListen = (port) => {
      server = app.listen(port, () => {
        console.log(`\nServer running on port ${port}`);
        console.log(`Health check:     http://localhost:${port}/health`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} busy, switching to ${port + 1}`);
          server.close();
          tryListen(port + 1);
        } else if (err.code === 'EACCES') {
          console.error(`Permission denied on port ${port}`);
          process.exit(1);
        } else {
          console.error('Server error:', err.message);
          process.exit(1);
        }
      });
    };

    tryListen(PORT);
  } catch (err) {
    if (err.message.includes('authentication failed') || err.message.includes('bad auth')) {
      console.error('\nMongoDB authentication failed.');
      console.error('  Check username/password in MONGODB_URI.');
      console.error(`  URI used: ${maskUri(process.env.MONGODB_URI || '')}`);
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.error('\nMongoDB host not found. Check the hostname in MONGODB_URI.');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('\nMongoDB connection refused. Is Atlas accessible from this network?');
    } else {
      console.error('\nFailed to start server:', err.message);
    }
    process.exit(1);
  }
};

startServer();