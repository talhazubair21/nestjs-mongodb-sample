interface ApiConfigProps {
  //   API_URL: string;
  //   HTTP_TIMEOUT: number;
  RATE_LIMIT_TTL: number;
  RATE_LIMIT: number;
}

interface MongodbConfigProps {
  CONNECTION_STRING: string;
}

export interface ConfigProps {
  PORT: number;
  NODE_ENV: string;
  SENTRY_DNS: string;
  JWT_SECRET_KEY: string;
  API: ApiConfigProps;
  MONGODB: MongodbConfigProps;
}
