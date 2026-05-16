import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  async incrementPresence(userId: string) {
    const key = `presence:${userId}:connections`;
    const count = await this.redis.incr(key);
    await this.redis.set(`presence:${userId}:status`, 'ONLINE');
    return count;
  }

  async decrementPresence(userId: string) {
    const key = `presence:${userId}:connections`;
    const remaining = await this.redis.decr(key);
    if (remaining <= 0) {
      await this.redis.del(key);
      await this.redis.set(`presence:${userId}:status`, 'OFFLINE');
      return 0;
    }

    return remaining;
  }

  async getPresenceStatus(userId: string) {
    return this.redis.get(`presence:${userId}:status`);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}

