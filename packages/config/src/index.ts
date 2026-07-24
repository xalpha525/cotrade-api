import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

export function loadEnv(): void {
  // Collect candidate directories from cwd up to root
  let currentDir = process.cwd();
  const searchDirs: string[] = [currentDir];

  while (currentDir !== path.dirname(currentDir)) {
    currentDir = path.dirname(currentDir);
    searchDirs.push(currentDir);
  }

  // Load .env.local and .env from root towards cwd
  for (const dir of searchDirs.reverse()) {
    const envLocalPath = path.join(dir, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath, override: false });
    }

    const envFilePath = path.join(dir, '.env');
    if (fs.existsSync(envFilePath)) {
      dotenv.config({ path: envFilePath, override: false });
    }
  }
}

// Auto-run environment initialization immediately on import
loadEnv();

const configSchema = z.object({
  // APP
  APP_ENV: z.enum(['local', 'development', 'staging', 'production']).default('local'),
  APP_NAME: z.string().default('CopyTrading'),
  APP_VERSION: z.string().default('1.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // SERVER
  API_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().int().positive().default(3000),

  // SECURITY
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  MASTER_ENCRYPTION_KEY: z.string().min(1, 'MASTER_ENCRYPTION_KEY is required'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://localhost:3000'),

  // RATE LIMITING
  RATE_LIMIT: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),

  // DATABASE
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(20),
  DATABASE_TIMEOUT: z.coerce.number().int().positive().default(30000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_DATABASE_URL: z.string().min(1, 'DIRECT_DATABASE_URL is required'),

  // REDIS
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),

  // SOLANA / HELIUS
  HELIUS_API_KEY: z.string().min(1, 'HELIUS_API_KEY is required'),
  HELIUS_RPC_URL: z.string().url('HELIUS_RPC_URL must be a valid URL'),
  HELIUS_WS_URL: z.string().min(1, 'HELIUS_WS_URL is required'),

  // ROBINHOOD CHAIN / ALCHEMY
  ROBINHOOD_API_KEY: z.string().min(1, 'ROBINHOOD_API_KEY is required'),
  ROBINHOOD_RPC_URL: z.string().url('ROBINHOOD_RPC_URL must be a valid URL'),
  ROBINHOOD_WS_URL: z.string().min(1, 'ROBINHOOD_WS_URL is required'),

  // PRIVY
  PRIVY_APP_ID: z.string().min(1, 'PRIVY_APP_ID is required'),
  PRIVY_APP_SECRET: z.string().min(1, 'PRIVY_APP_SECRET is required'),

  // BLOCKCHAIN
  EVM_NETWORK: z.string().default('robinhood-mainnet'),
  SOLANA_NETWORK: z.string().default('mainnet'),

  // TRADING ENGINE
  DEFAULT_PRIORITY_FEE: z.string().default('medium'),
  MAX_COPY_TRADES: z.coerce.number().int().positive().default(20),
  MAX_SLIPPAGE_BPS: z.coerce.number().int().nonnegative().default(100),
  WS_HEARTBEAT_INTERVAL: z.coerce.number().int().positive().default(30000),
  WS_RECONNECT_DELAY: z.coerce.number().int().positive().default(5000),

  // NOTIFICATIONS
  FCM_PROJECT_ID: z.string().optional(),
  ONESIGNAL_APP_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // FEATURES
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  ENABLE_COPY_TRADING: z.coerce.boolean().default(true),
  ENABLE_NOTIFICATIONS: z.coerce.boolean().default(true),

  // LOGGING
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info')
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment variables. Application startup aborted.');
  }
  return result.data;
}

export const config: Config = loadConfig();
