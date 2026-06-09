import type { Request, Response, NextFunction } from 'express';
import { isSetupComplete } from './authStore.js';

export function requireSetup(req: Request, res: Response, next: NextFunction): void {
  if (!isSetupComplete()) {
    res.redirect('/setup');
    return;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if ((req.session as any)?.authenticated) {
    next();
    return;
  }
  // Use originalUrl so the check works regardless of mount prefix stripping
  if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/auth/')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.redirect('/login');
}

export function checkCsrf(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const token   = req.headers['x-csrf-token'] as string | undefined;
  const session = req.session as any;
  if (!token || !session?.csrfToken || token !== session.csrfToken) {
    res.status(403).json({ error: 'invalid csrf token' });
    return;
  }
  next();
}
