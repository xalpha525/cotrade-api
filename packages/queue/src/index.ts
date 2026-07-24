export type QueueName =
  | 'execution'
  | 'notification'
  | 'analytics'
  | 'price'
  | 'wallet'
  | 'retry'
  | 'dead-letter'
  | 'trade-execution';

export interface BaseJobData {
  jobId: string;
  timestamp: number;
  correlationId?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface TradeExecutionJobPayload extends BaseJobData {
  masterTradeId: string;
  followerWalletAddress: string;
  tokenAddress: string;
  amount: string;
  side: 'BUY' | 'SELL';
  maxSlippageBps: number;
}

export interface NotificationJobPayload extends BaseJobData {
  userId: string;
  title: string;
  body: string;
  type: 'TRADE_EXECUTED' | 'RISK_ALERT' | 'SYSTEM';
}

import type { ChainId } from '@copytrading/db';

export type WalletOwnerType = 'USER_PRIVY' | 'USER_EXTERNAL' | 'MASTER_TRADER';

export interface WalletMonitorJobPayload extends BaseJobData {
  walletId: string;
  userId?: string;
  address: string;
  chainId: ChainId;
  ownerType: WalletOwnerType;
  action: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'REFRESH_BALANCE';
}

export interface PriceUpdateJobPayload extends BaseJobData {
  tokenAddress: string;
  chainId: string;
  priceUsd: number;
}

export interface QueueJobOptions {
  attempts?: number;
  backoffDelayMs?: number;
  priority?: number;
}

// Enterprise Retry Manager with Backoff & Jitter
export class RetryManager {
  static calculateBackoffDelay(
    attempt: number,
    initialDelayMs = 1000,
    maxDelayMs = 60000,
    jitterFactor = 0.2
  ): number {
    const exponential = initialDelayMs * Math.pow(2, attempt - 1);
    const capped = Math.min(exponential, maxDelayMs);
    const jitter = capped * jitterFactor * (Math.random() * 2 - 1);
    return Math.floor(Math.max(initialDelayMs, capped + jitter));
  }

  static isPermanentFailure(error: Error | unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('INSUFFICIENT_FUNDS') ||
        error.message.includes('INVALID_ADDRESS') ||
        error.message.includes('UNAUTHORIZED')
      );
    }
    return false;
  }
}

export interface JobQueue<TPayload extends BaseJobData> {
  readonly queueName: QueueName;
  enqueue(payload: TPayload, options?: QueueJobOptions): Promise<string>;
  process(handler: (payload: TPayload) => Promise<void>): void;
}

export class SpecializedQueue<TPayload extends BaseJobData> implements JobQueue<TPayload> {
  private handler: ((payload: TPayload) => Promise<void>) | null = null;
  private pendingJobs: TPayload[] = [];

  constructor(readonly queueName: QueueName) {}

  async enqueue(payload: TPayload, _options?: QueueJobOptions): Promise<string> {
    if (this.handler) {
      // Dispatch immediately (non-blocking — run in background microtask)
      setImmediate(async () => {
        try {
          await this.handler!(payload);
        } catch (err) {
          console.error(`[Queue:${this.queueName}] Job ${payload.jobId} failed:`, err);
        }
      });
    } else {
      // Buffer jobs until a handler is registered
      this.pendingJobs.push(payload);
    }
    return payload.jobId;
  }

  process(handler: (payload: TPayload) => Promise<void>): void {
    this.handler = handler;
    // Drain any buffered jobs that arrived before the handler was registered
    if (this.pendingJobs.length > 0) {
      const buffered = [...this.pendingJobs];
      this.pendingJobs = [];
      for (const job of buffered) {
        setImmediate(async () => {
          try {
            await handler(job);
          } catch (err) {
            console.error(`[Queue:${this.queueName}] Buffered job ${job.jobId} failed:`, err);
          }
        });
      }
    }
  }
}

// Alias for backward compatibility
export { SpecializedQueue as InMemoryQueue };

// Dedicated Queue Instances
export const walletMonitorQueue = new SpecializedQueue<WalletMonitorJobPayload>('wallet');
export const executionQueue = new SpecializedQueue<TradeExecutionJobPayload>('execution');
export const notificationQueue = new SpecializedQueue<NotificationJobPayload>('notification');
export const priceQueue = new SpecializedQueue<PriceUpdateJobPayload>('price');
export const retryQueue = new SpecializedQueue<BaseJobData>('retry');
export const deadLetterQueue = new SpecializedQueue<BaseJobData>('dead-letter');
