import { AsyncLocalStorage } from 'async_hooks';

// Async Context Storage for Request ID & Correlation ID Tracing
export interface TraceContext {
  requestId: string;
  correlationId: string;
  userId?: string;
  startTime: number;
}

export const traceStorage = new AsyncLocalStorage<TraceContext>();

export function runWithTraceContext<T>(context: TraceContext, fn: () => Promise<T>): Promise<T> {
  return traceStorage.run(context, fn);
}

export function getTraceContext(): TraceContext | undefined {
  return traceStorage.getStore();
}

// Precision Performance Timer
export function startTimer() {
  const start = process.hrtime.bigint();
  return {
    endMs(): number {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1_000_000;
    }
  };
}

// Feature Flag Service
export class FeatureFlagService {
  private static flags = new Map<string, boolean>([
    ['ENABLE_COPY_TRADING', true],
    ['ENABLE_NOTIFICATIONS', true],
    ['ENABLE_ANALYTICS', false],
    ['ENABLE_SOLANA_PROPRIETARY_PARSER', true],
    ['ENABLE_ROBINHOOD_EVM_INDEXER', true]
  ]);

  static isEnabled(flagName: string): boolean {
    const envVal = process.env[flagName];
    if (envVal !== undefined) {
      return envVal === 'true' || envVal === '1';
    }
    return this.flags.get(flagName) ?? false;
  }

  static setFlag(flagName: string, enabled: boolean): void {
    this.flags.set(flagName, enabled);
  }
}

// Job Scheduler Framework
export interface ScheduledJob {
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  isProcessing?: boolean;
}

export class JobScheduler {
  private jobs = new Map<string, ScheduledJob>();

  registerJob(job: ScheduledJob): void {
    this.jobs.set(job.name, job);
  }

  async runJob(name: string): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job not registered: ${name}`);
    }
    if (job.isProcessing) return;

    job.isProcessing = true;
    try {
      await job.handler();
    } finally {
      job.isProcessing = false;
    }
  }
}

// Helper utilities
export function truncateAddress(address: string, startChars = 4, endChars = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const backoffMs = options.backoffMs ?? 500;

  let lastError: Error | unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
