import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    let query = getDb().from('therapist_profiles').select('*').order('name');
    if (req.query.profession) query = query.eq('profession', req.query.profession as string);
    if (req.query.track) query = query.eq('track', req.query.track as string);
    if (req.query.listed === 'true') query = query.eq('is_listed', true);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await getDb().from('therapist_profiles').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Therapist not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { name, credentials, profession, email, website, bio, location, specializations, track } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const prof = profession || 'therapist';
    const resolvedTrack = track || (
      ['healer', 'coach', 'wellness', 'meditation', 'grief', 'spiritual'].includes(prof) ? 'wellness'
        : prof === 'peer' ? 'peer'
        : 'clinical'
    );
    const { data, error } = await getDb().from('therapist_profiles').insert({
      name, credentials, profession: prof, track: resolvedTrack, email, website, bio, location,
      specializations: specializations || [],
      invitation_status: 'applied',
      is_listed: false,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Application received! We will review and contact you within 48 hours.', id: data.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
