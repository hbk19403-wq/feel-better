import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { matchListeners } from '../services/matchingService';
import { dbGet, dbAll } from '../config/database';

const router = Router();

// GET /listeners/match?category=<id>
router.get('/match', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await dbGet<any>('SELECT language_preference FROM users WHERE id = $1', [req.user!.sub]);
    const category = (req.query.category as string) || 'venting_general';
    const listeners = await matchListeners({
      categoryId: category,
      language: user?.language_preference || 'English',
      sessionType: 'voice',
      userId: req.user!.sub,
    });
    res.json({ listeners });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /listeners/available (legacy alias)
router.get('/available', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await dbGet<any>('SELECT language_preference FROM users WHERE id = $1', [req.user!.sub]);
    const listeners = await matchListeners({
      categoryId: (req.query.category_id as string) || 'venting_general',
      language: user?.language_preference || 'English',
      sessionType: 'voice',
      userId: req.user!.sub,
    });
    res.json({ listeners });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /listeners — all listeners (admin / debug)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const listeners = await dbAll('SELECT id, alias, display_name, bio, specializations, languages, is_online, average_rating, total_sessions FROM listeners ORDER BY average_rating DESC');
    res.json({ listeners });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
