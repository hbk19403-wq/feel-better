import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { matchListeners } from '../services/matchingService';
import { getDb } from '../config/database';

const router = Router();

router.get('/match', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: user } = await getDb().from('users').select('language_preference').eq('id', req.user!.sub).single();
    const category = (req.query.category as string) || 'venting_general';
    const listeners = await matchListeners({
      categoryId: category,
      language: user?.language_preference || 'English',
      userId: req.user!.sub,
    });
    res.json({ listeners });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/available', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: user } = await getDb().from('users').select('language_preference').eq('id', req.user!.sub).single();
    const listeners = await matchListeners({
      categoryId: (req.query.category_id as string) || 'venting_general',
      language: user?.language_preference || 'English',
      userId: req.user!.sub,
    });
    res.json({ listeners });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: listeners } = await getDb()
      .from('listeners')
      .select('id, alias, display_name, bio, specializations, languages, is_online, average_rating, total_sessions')
      .order('average_rating', { ascending: false });
    res.json({ listeners });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
