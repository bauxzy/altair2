import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { categorySchema } from '../lib/schemas';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get all categories (system + user custom)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${req.userId},is_system.eq.true`)
    .order('name');

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

// Create custom category
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...parsed.data, user_id: req.userId!, is_system: false })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

// Delete custom category
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .eq('is_system', false);

  if (error) {
    res.status(400).json({ error: 'Cannot delete system category or not found' });
    return;
  }

  res.json({ message: 'Category deleted' });
});

export default router;
