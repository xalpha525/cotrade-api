import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { logger } from '@copytrading/logger';
import { sendError } from '../utils/response.js';

export const globalErrorHandler: ErrorHandler = (err, c) => {
  logger.error({ err }, 'Unhandled API Exception');

  if (err instanceof ZodError) {
    return sendError(c, 'VALIDATION_ERROR', 'Request validation failed', 400, err.issues);
  }

  const message = err.message || 'An unexpected error occurred.';

  if (message.includes('UNAUTHENTICATED')) {
    return sendError(c, 'UNAUTHENTICATED', message, 401);
  }

  if (message.includes('FORBIDDEN')) {
    return sendError(c, 'FORBIDDEN', message, 403);
  }

  return sendError(c, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.', 500);
};
