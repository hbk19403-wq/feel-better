import { Request, Response, NextFunction } from 'express';

// Central error handler. Never leaks internals to the client, but distinguishes
// a few common recoverable cases (malformed JSON, oversized payloads) so the
// caller gets an actionable 4xx instead of a blanket 500.
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  // body-parser throws a SyntaxError with a `body` property on invalid JSON.
  if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' });
    return;
  }

  console.error(`[error] ${req.method} ${req.path}:`, err?.message || err);
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: 'Internal server error' });
}
