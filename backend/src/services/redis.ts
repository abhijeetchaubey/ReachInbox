import Redis from 'ioredis';
import { RedisMemoryServer } from 'redis-memory-server';
import { config } from '../config';

export let redisClient: Redis;

export async function initRedis(): Promise<Redis> {
  if (redisClient) return redisClient;

  // 1. Try external Redis (e.g. Docker / local daemon on 6379)
  try {
    const externalRedis = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 1000,
    });

    await new Promise<void>((resolve, reject) => {
      externalRedis.once('ready', () => {
        console.log(`[Redis] Connected to external Redis at ${config.redisHost}:${config.redisPort}`);
        resolve();
      });
      externalRedis.once('error', (err) => {
        externalRedis.disconnect();
        reject(err);
      });
    });

    redisClient = externalRedis;
    return redisClient;
  } catch (err) {
    console.log('[Redis] External Redis not found at localhost:6379. Launching embedded Redis Server...');
  }

  // 2. Embedded RedisMemoryServer fallback
  try {
    const redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    console.log(`[RedisMemoryServer] Embedded Redis active at ${host}:${port}`);

    redisClient = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
    });

    return redisClient;
  } catch (err: any) {
    console.warn(`[RedisMemoryServer Warning]: ${err.message}. Falling back to default ioredis.`);
    redisClient = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      maxRetriesPerRequest: null,
    });
    return redisClient;
  }
}

export const redisConnectionOptions = {
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null,
};
