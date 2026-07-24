import type { Context } from 'hono';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export function sendSuccess<T>(c: Context, data: T, statusCode = 200, meta?: Record<string, unknown>) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString()
  };
  return c.json(payload, statusCode as 200);
}

export function sendError(c: Context, code: string, message: string, statusCode = 400, details?: unknown) {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    },
    timestamp: new Date().toISOString()
  };
  return c.json(payload, statusCode as 400);
}
