import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { transactionSchema } from '../lib/schemas';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get all transactions (with filters)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, category_id, start_date, end_date, search, limit = '50', offset = '0' } = req.query;

  let query = supabase
    .from('transactions')
    .select('*, categories(id, name, icon, color, type)')
    .eq('user_id', req.userId!)
    .order('date', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  if (type) query = query.eq('type', type);
  if (category_id) query = query.eq('category_id', category_id);
  if (start_date) query = query.gte('date', start_date);
  if (end_date) query = query.lte('date', end_date);
  if (search) query = query.ilike('notes', `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ transactions: data, total: count });
});

// Get single transaction
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, icon, color, type)')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  res.json(data);
});

// Create transaction
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...parsed.data, user_id: req.userId! })
    .select('*, categories(id, name, icon, color, type)')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

// Update transaction
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = transactionSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(parsed.data)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select('*, categories(id, name, icon, color, type)')
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Transaction not found or unauthorized' });
    return;
  }

  res.json(data);
});

// Delete transaction
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!);

  if (error) {
    res.status(404).json({ error: 'Transaction not found or unauthorized' });
    return;
  }

  res.json({ message: 'Transaction deleted' });
});

// Export CSV
router.get('/export/csv', async (req: AuthRequest, res: Response): Promise<void> => {
  const { start_date, end_date } = req.query;

  let query = supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', req.userId!)
    .order('date', { ascending: false });

  if (start_date) query = query.gte('date', start_date);
  if (end_date) query = query.lte('date', end_date);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Mode', 'Notes'];
  const rows = (data || []).map((t: any) => [
    t.date,
    t.type,
    t.categories?.name || '',
    t.amount,
    t.payment_mode,
    t.notes || '',
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=altair-transactions.csv');
  res.send(csv);
});

export default router;
