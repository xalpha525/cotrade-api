import pino, { Logger, LoggerOptions } from 'pino';

export interface LoggerConfig {
  name?: string;
  level?: string;
  isProduction?: boolean;
}

export function createLogger(config?: LoggerConfig): Logger {
  const isProduction = config?.isProduction ?? process.env['NODE_ENV'] === 'production';
  const level = config?.level ?? process.env['LOG_LEVEL'] ?? (isProduction ? 'info' : 'debug');
  const name = config?.name ?? 'copytrading';

  const options: LoggerOptions = {
    name,
    level,
    timestamp: pino.stdTimeFunctions.isoTime
  };

  if (!isProduction) {
    return pino(
      options,
      pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      })
    );
  }

  return pino(options);
}

export const logger: Logger = createLogger();
export type { Logger };
