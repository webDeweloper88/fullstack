import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined in environment variables');
    }

    this.redisClient = new Redis(redisUrl);

    this.redisClient.on('connect', () => {
      console.log(`✅ Redis connected: ${redisUrl}`);
    });

    this.redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redisClient.exists(key)) === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }

  async setRefreshToken(userId: string, token: string): Promise<void> {
    const key = `session:${userId}`;
    const ttl = 60 * 60 * 24 * 7; // 7 дней
    await this.set(key, token, ttl);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.get(`session:${userId}`);
  }
}
