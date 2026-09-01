import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://reachinbox:reachinbox_secret@localhost:5432/email_scheduler?schema=public',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  jwtSecret: process.env.JWT_SECRET || 'reachinbox_super_secret_jwt_key_2026',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  defaultMinDelaySec: parseInt(process.env.DEFAULT_MIN_DELAY_SEC || '2', 10),
  defaultHourlyLimit: parseInt(process.env.DEFAULT_HOURLY_LIMIT || '200', 10),
};
