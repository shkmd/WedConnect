import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

interface RequestLike {
  method: string;
  url?: string;
  originalUrl?: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

interface ResponseLike {
  statusCode: number;
  setHeader(key: string, value: string): void;
  on(event: 'finish', callback: () => void): void;
  status(code: number): ResponseLike;
  json(body: unknown): void;
}

type Next = () => void;
const windows = new Map<string, { count: number; reset: number }>();

function client(request: RequestLike) {
  const forwarded = request.headers['x-forwarded-for'];
  return (
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ??
    request.socket?.remoteAddress ??
    'unknown'
  );
}

export function hardeningMiddleware(allowedOrigins: Set<string>) {
  return (request: RequestLike, response: ResponseLike, next: Next) => {
    const correlationId =
      typeof request.headers['x-correlation-id'] === 'string'
        ? request.headers['x-correlation-id'].slice(0, 80)
        : randomUUID();
    const path = (request.originalUrl ?? request.url ?? '/').split('?')[0] ?? '/';
    const startedAt = Date.now();

    request.headers['x-correlation-id'] = correlationId;
    response.setHeader('X-Correlation-ID', correlationId);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (process.env.NODE_ENV === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    const origin = request.headers.origin;
    if (
      typeof origin === 'string' &&
      !allowedOrigins.has(origin) &&
      !path.endsWith('/billing/razorpay/webhook')
    ) {
      response.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Origin not allowed',
        correlationId,
      });
      return;
    }

    const now = Date.now();
    const limit = path.includes('/auth/otp/') ? 10 : 120;
    const key = `${client(request)}:${path.includes('/auth/otp/') ? 'otp' : 'api'}`;
    const entry = windows.get(key);
    if (!entry || entry.reset <= now) {
      windows.set(key, { count: 1, reset: now + 60_000 });
    } else if (++entry.count > limit) {
      response.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1_000)));
      response.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        correlationId,
      });
      return;
    }

    response.on('finish', () => {
      process.stdout.write(
        `${JSON.stringify({
          level: 'info',
          event: 'http_request',
          method: request.method,
          path,
          status: response.statusCode,
          durationMs: Date.now() - startedAt,
          correlationId,
        })}\n`,
      );
    });
    next();
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestLike>();
    const response = http.getResponse<ResponseLike>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof raw === 'object' && raw && 'message' in raw
        ? (raw as { message: unknown }).message
        : status === 500
          ? 'Internal server error'
          : String(raw ?? 'Request failed');

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      correlationId:
        typeof request.headers['x-correlation-id'] === 'string'
          ? request.headers['x-correlation-id']
          : undefined,
      timestamp: new Date().toISOString(),
      path: (request.originalUrl ?? request.url ?? '/').split('?')[0],
    });
  }
}
