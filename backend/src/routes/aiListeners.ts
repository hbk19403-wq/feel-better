import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';

const router = Router();

// Columns safe to expose to API clients. Internal-only fields such as
// personality_prompt are deliberately excluded.
const PUBLIC_COLUMNS = 'id, name, gender, avatar_emoji, voice_id, specializations, languages';

router.get('/', async (req: Request, res: Response) => {
  try {
    let query = getDb().from('ai_listeners').select(PUBLIC_COLUMNS).eq('is_active', true).order('name');
    if (req.query.gender) query = query.eq('gender', req.query.gender as string);
    if (req.query.topic) query = query.contains('specializations', JSON.stringify([req.query.topic]));
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await getDb().from('ai_listeners').select(PUBLIC_COLUMNS).eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'AI listener not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
