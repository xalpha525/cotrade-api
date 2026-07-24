import { Redis } from '@upstash/redis';

export function createRedisClient(): Redis {
  const url = process.env['UPSTASH_REDIS_REST_URL'] ?? 'https://driving-duckling-167186.upstash.io';
  const token = process.env['UPSTASH_REDIS_REST_TOKEN'] ?? 'gQAAAAAAAo0SAAIgcDFkZmNjNzQxMzZlYzY0YjVkYThhODQ5MjcxZGUwYzg0Zg';

  return new Redis({ url, token });
}

export const redis: Redis = createRedisClient();

export interface RedisHealthResult {
  status: 'ok' | 'error';
  latencyMs: number;
  message?: string;
}

export async function checkRedisHealth(client: Redis = redis): Promise<RedisHealthResult> {
  const start = Date.now();
  try {
    const pong = await client.ping();
    const latencyMs = Date.now() - start;
    if (pong === 'PONG' || pong === 'pong') {
      return { status: 'ok', latencyMs };
    }
    return { status: 'error', latencyMs, message: `Unexpected response: ${String(pong)}` };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown Redis error';
    return { status: 'error', latencyMs, message };
  }
}

// Distributed Redis Lock Manager
export class DistributedLockManager {
  constructor(private readonly client: Redis = redis) {}

  async acquireLock(lockKey: string, ttlSeconds = 30): Promise<boolean> {
    const result = await this.client.set(`lock:${lockKey}`, 'LOCKED', {
      nx: true,
      ex: ttlSeconds
    });
    return result === 'OK';
  }

  async releaseLock(lockKey: string): Promise<boolean> {
    const result = await this.client.del(`lock:${lockKey}`);
    return result > 0;
  }
}

// Leader Election Helper for Worker Scaling
export class LeaderElector {
  private isLeaderFlag = false;

  constructor(
    private readonly instanceId: string,
    private readonly serviceName: string,
    private readonly client: Redis = redis
  ) {}

  async campaign(ttlSeconds = 15): Promise<boolean> {
    const result = await this.client.set(`leader:${this.serviceName}`, this.instanceId, {
      nx: true,
      ex: ttlSeconds
    });

    if (result === 'OK') {
      this.isLeaderFlag = true;
      return true;
    }

    const currentLeader = await this.client.get<string>(`leader:${this.serviceName}`);
    this.isLeaderFlag = currentLeader === this.instanceId;
    return this.isLeaderFlag;
  }

  get isLeader(): boolean {
    return this.isLeaderFlag;
  }
}

// Global Idempotency Store
export class RedisIdempotencyStore {
  constructor(private readonly client: Redis = redis) {}

  async exists(idempotencyKey: string): Promise<boolean> {
    const val = await this.client.get(`idempotency:${idempotencyKey}`);
    return Boolean(val);
  }

  async store(idempotencyKey: string, resultData: Record<string, unknown>, ttlSeconds = 86400): Promise<void> {
    await this.client.set(`idempotency:${idempotencyKey}`, JSON.stringify(resultData), {
      ex: ttlSeconds
    });
  }

  async getResult<T>(idempotencyKey: string): Promise<T | null> {
    const val = await this.client.get<string>(`idempotency:${idempotencyKey}`);
    if (!val) return null;
    return JSON.parse(val) as T;
  }
}

export { Redis };
