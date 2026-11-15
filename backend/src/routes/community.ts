import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from '../config/database';
import { verifyAccessToken } from '../services/jwtService';
import { detectCrisis, CRISIS_RESOURCES } from '../services/supportKnowledge';

const router = Router();

// Posting is allowed anonymously, but if a valid token is present we attach the
// user so they could later manage their own content. Never blocks the request.
function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { req.user = verifyAccessToken(header.slice(7)); } catch { /* stay anonymous */ }
  }
  next();
}

function cleanAlias(raw: any): string {
  const a = (raw ?? '').toString().trim().slice(0, 40);
  return a || 'Anonymous';
}

// --- Groups -----------------------------------------------------------------
router.get('/groups', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await getDb()
      .from('community_groups')
      .select('id, slug, name, description, emoji, post_count, sort_order')
      .order('sort_order', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ groups: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Posts in a group (by slug), newest first.
router.get('/groups/:slug/posts', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: group } = await db.from('community_groups').select('*').eq('slug', req.params.slug).maybeSingle();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const { data: posts } = await db
      .from('community_posts')
      .select('id, author_alias, title, body, support_count, comment_count, created_at')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false })
      .limit(100);
    res.json({ group, posts: posts || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a post (anonymous by default).
router.post('/groups/:slug/posts', optionalAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const body = (req.body?.body || '').toString().trim();
    if (!body) return res.status(400).json({ error: 'body required' });

    const { data: group } = await db.from('community_groups').select('id').eq('slug', req.params.slug).maybeSingle();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const crisis = detectCrisis(body);
    const { data: post, error } = await db.from('community_posts').insert({
      group_id: group.id,
      user_id: req.user?.sub || null,
      author_alias: cleanAlias(req.body?.alias),
      title: req.body?.title ? req.body.title.toString().trim().slice(0, 160) : null,
      body: body.slice(0, 8000),
      is_anonymous: req.body?.is_anonymous !== false,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });

    await db.rpc('increment_group_posts', { gid: group.id }).then(
      () => {},
      async () => {
        // Fallback if the helper RPC isn't present — best-effort manual bump.
        const { data: g } = await db.from('community_groups').select('post_count').eq('id', group.id).single();
        await db.from('community_groups').update({ post_count: (g?.post_count || 0) + 1 }).eq('id', group.id);
      },
    );

    res.status(201).json({ post, crisis, crisis_resources: crisis ? CRISIS_RESOURCES : undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Live chat rooms --------------------------------------------------------
function isMissingTable(err: any): boolean {
  const m = `${err?.message || err?.code || ''}`.toLowerCase();
  return m.includes('does not exist') || err?.code === '42p01' || m.includes('could not find the table');
}

// Read a room's recent messages (optionally only those after a timestamp, for polling).
router.get('/groups/:slug/chat', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: group } = await db.from('community_groups').select('id, slug, name, description, emoji').eq('slug', req.params.slug).maybeSingle();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    let q = db
      .from('community_chat_messages')
      .select('id, author_alias, body, is_crisis, created_at')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true })
      .limit(200);
    const after = (req.query.after || '').toString();
    if (after) q = q.gt('created_at', after);

    const { data, error } = await q;
    if (error) {
      if (isMissingTable(error)) return res.json({ group, messages: [], setup_pending: true });
      return res.status(500).json({ error: error.message });
    }
    res.json({ group, messages: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Post a message into a room (anonymous by default).
router.post('/groups/:slug/chat', optionalAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const body = (req.body?.body || '').toString().trim();
    if (!body) return res.status(400).json({ error: 'body required' });

    const { data: group } = await db.from('community_groups').select('id').eq('slug', req.params.slug).maybeSingle();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const crisis = detectCrisis(body);
    const { data: message, error } = await db.from('community_chat_messages').insert({
      group_id: group.id,
      user_id: req.user?.sub || null,
      author_alias: cleanAlias(req.body?.alias),
      body: body.slice(0, 2000),
      is_crisis: crisis,
    }).select('id, author_alias, body, is_crisis, created_at').single();
    if (error) {
      if (isMissingTable(error)) return res.status(503).json({ error: 'Chat rooms not set up yet. Apply migration 004_community_chat.sql.' });
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message, crisis, crisis_resources: crisis ? CRISIS_RESOURCES : undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single post with its comments.
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: post } = await db.from('community_posts').select('*').eq('id', req.params.id).maybeSingle();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const { data: comments } = await db
      .from('community_comments')
      .select('id, author_alias, body, created_at')
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });
    res.json({ post, comments: comments || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add a comment / suggestion to a post.
router.post('/posts/:id/comments', optionalAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const body = (req.body?.body || '').toString().trim();
    if (!body) return res.status(400).json({ error: 'body required' });

    const { data: post } = await db.from('community_posts').select('id, comment_count').eq('id', req.params.id).maybeSingle();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { data: comment, error } = await db.from('community_comments').insert({
      post_id: post.id,
      user_id: req.user?.sub || null,
      author_alias: cleanAlias(req.body?.alias),
      body: body.slice(0, 4000),
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });

    await db.from('community_posts').update({ comment_count: (post.comment_count || 0) + 1 }).eq('id', post.id);
    res.status(201).json({ comment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// "I feel this too" support tap.
router.post('/posts/:id/support', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: post } = await db.from('community_posts').select('support_count').eq('id', req.params.id).maybeSingle();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const next = (post.support_count || 0) + 1;
    await db.from('community_posts').update({ support_count: next }).eq('id', req.params.id);
    res.json({ support_count: next });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
