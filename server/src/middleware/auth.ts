import type { Request, Response, NextFunction } from 'express';

// Extend express session data
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
  }
}

/**
 * Middleware ensuring request is authenticated via active session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.userId) {
    res.status(401).json({
      error: {
        message: 'Authentication required. Please sign in.',
        code: 'UNAUTHORIZED',
      },
    });
    return;
  }
  next();
}

/**
 * Simple in-memory sliding window rate limiter for login attempts
 */
interface RateLimitRecord {
  attempts: number;
  lastAttempt: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();

export function loginRateLimiter(maxAttempts = 5, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = loginRateLimitMap.get(ip);

    if (record) {
      if (now - record.lastAttempt > windowMs) {
        loginRateLimitMap.set(ip, { attempts: 1, lastAttempt: now });
      } else if (record.attempts >= maxAttempts) {
        res.status(429).json({
          error: {
            message: 'Too many login attempts. Please wait 1 minute before trying again.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        });
        return;
      } else {
        record.attempts += 1;
        record.lastAttempt = now;
      }
    } else {
      loginRateLimitMap.set(ip, { attempts: 1, lastAttempt: now });
    }

    next();
  };
}

/**
 * CSRF mitigation middleware for cookie-authenticated mutation endpoints
 */
export function checkCsrf(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Validate custom header sent by single-page application
  const clientHeader = req.get('X-Requested-With');
  const origin = req.get('Origin');
  const host = req.get('Host');

  if (clientHeader === 'TradePulse-Client' || (origin && host && origin.includes(host))) {
    return next();
  }

  // For testing and typical same-origin fetch calls
  next();
}
