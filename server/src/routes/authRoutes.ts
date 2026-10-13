import { Router, type Request, type Response, type NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { requireAuth, loginRateLimiter, checkCsrf } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.use(checkCsrf);

/**
 * POST /api/auth/register
 */
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: { message: 'Email and password are required', code: 'INVALID_INPUT' } });
      return;
    }

    const user = await AuthService.register(email, password);

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        next(err);
        return;
      }
      req.session.userId = user.id;
      req.session.email = user.email;

      res.status(201).json({
        data: {
          user,
        },
      });
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ error: { message, code: 'REGISTRATION_ERROR' } });
  }
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', loginRateLimiter(5, 60000), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: { message: 'Email and password are required', code: 'INVALID_INPUT' } });
      return;
    }

    const user = await AuthService.authenticate(email, password);

    // Rotate session ID on authentication
    req.session.regenerate((err) => {
      if (err) {
        next(err);
        return;
      }
      req.session.userId = user.id;
      req.session.email = user.email;

      res.json({
        data: {
          user,
        },
      });
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.status(401).json({ error: { message, code: 'INVALID_CREDENTIALS' } });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', requireAuth, (req: Request, res: Response, next: NextFunction): void => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie('tradepulse_sid');
    res.json({ data: { message: 'Successfully signed out' } });
  });
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  if (!req.session || !req.session.userId) {
    res.json({ data: { user: null } });
    return;
  }

  const user = await AuthService.getProfile(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    res.clearCookie('tradepulse_sid');
    res.json({ data: { user: null } });
    return;
  }

  res.json({
    data: {
      user,
    },
  });
});
