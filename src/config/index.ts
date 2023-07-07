import { ConfigProps } from './config.interface';

export const config = (): ConfigProps => ({
  PORT: +process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  SENTRY_DNS: process.env.SENTRY_DNS,
  API: {
    // API_URL: process.env.API_URL,
    // HTTP_TIMEOUT: 1000,
    RATE_LIMIT_TTL: +process.env.THROTTLE_TTL,
    RATE_LIMIT: +process.env.THROTTLE_LIMIT,
  },
  MONGODB: {
    CONNECTION_STRING: process.env.MONGODB_URL,
  },
});
