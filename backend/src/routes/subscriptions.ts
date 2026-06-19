import { Router, Request, Response } from 'express';
import { dbGet, dbRun } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

const PLAN_LIMITS: Record<string, number | null> = {
  free: 0, pay_per_session: null, basic: 8, standard: null, premium: null, corporate: null,
};

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = dbGet<any>('SELECT subscription_plan FROM users WHERE id = ?', [req.user!.sub]);
  const plan = user?.subscription_plan ?? 'free';
  res.json({ plan, status: 'active', sessions_used: 0, sessions_limit: PLAN_LIMITS[plan] });
});

router.post('/checkout', requireAuth, (req: Request, res: Response) => {
  const { plan } = req.body;
  const validPlans = ['pay_per_session', 'basic', 'standard', 'premium'];
  if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
  res.json({ checkout_url: `https://checkout.stripe.com/pay/demo_${plan}`, message: 'Stripe integration required — configure STRIPE_SECRET_KEY to activate' });
});

router.post('/cancel', requireAuth, (req: Request, res: Response) => {
  dbRun("UPDATE users SET subscription_plan = 'free', updated_at = datetime('now') WHERE id = ?", [req.user!.sub]);
  res.json({ message: 'Subscription cancelled. Moved to free tier.' });
});

export default router;
