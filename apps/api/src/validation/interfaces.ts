export interface ValidationMetrics {
  detectionAccuracyPercent: number;
  quoteAccuracyPercent: number;
  executionLatencyMs: number;
  duplicateRatePercent: number;
  missedTradeRatePercent: number;
  rpcLatencyMs: { p50: number; p95: number; p99: number };
  memoryUsageMb: number;
  cpuUsagePercent: number;
  eventThroughputPerSec: number;
}

export interface ReplayConfig {
  sampleSize: number;
  chainId?: string;
  concurrency: number;
}

export interface LoadTestConfig {
  targetRps: number;
  durationSeconds: number;
}

export interface ChaosTestConfig {
  packetLossPercent: number;
  rpcLatencyJitterMs: number;
}

export interface ValidationReport {
  suiteName: string;
  status: 'PASSED' | 'FAILED' | 'PARTIAL';
  timestamp: string;
  metrics: ValidationMetrics;
  details: Record<string, unknown>;
}
