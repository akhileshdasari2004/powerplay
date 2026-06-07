export const nodeEnv = process.env.NODE_ENV || 'development';
export const isProduction = nodeEnv === 'production';
export const isDevelopment = nodeEnv === 'development';

export const envSchema = {
  required: ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'],
  optional: [
    'PORT',
    'NODE_ENV',
    'CORS_ORIGIN',
    'ACCESS_TOKEN_EXPIRY',
    'REFRESH_TOKEN_EXPIRY',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
  ],
};

export const validateEnv = () => {
  const errors = [];

  for (const key of envSchema.required) {
    if (!process.env[key]) {
      errors.push(`${key} is required but not set`);
    }
  }

  if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    if (!uri.startsWith('mongodb')) {
      errors.push(`MONGODB_URI must start with 'mongodb', got '${uri.split('://')[0]}'`);
    }
    const hasUsername = uri.includes('@');
    const hasPassword = /:\/\/[^:]+:.*@/.test(uri);
    if (!hasUsername || !hasPassword) {
      errors.push('MONGODB_URI must contain username and password');
    }
  }

  if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET.length < 32) {
    errors.push('JWT_ACCESS_SECRET must be at least 32 characters');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters');
  }

  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid port number (1-65535)');
    }
  }

  if (errors.length > 0) {
    console.error('\nEnvironment validation failed:');
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error('');
    return false;
  }

  return true;
};

export default { nodeEnv, isProduction, isDevelopment, envSchema, validateEnv };