import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { budgetSchema } from '../lib/schemas';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get budgets for a month
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const m = parseInt(month as string) || currentDate.getMonth() + 1;
  const y = parseInt(year as string) || currentDate.getFullYear();

  const { data: budgets, error } = await supabase
    .from('budgets')
    .select('*, categories(id, name, icon, color)')
    .eq('user_id', req.userId!)
    .eq('month', m)
    .eq('year', y);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Get spent amounts per category
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];

  const { data: transactions } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', req.userId!)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate);

  const spent: Record<string, number> = {};
  (transactions || []).forEach((t: any) => {
    spent[t.category_id] = (spent[t.category_id] || 0) + t.amount;
  });

  const enriched = (budgets || []).map((b: any) => ({
    ...b,
    spent: spent[b.category_id] || 0,
    percentage: b.amount > 0 ? ((spent[b.category_id] || 0) / b.amount) * 100 : 0,
  }));

  res.json(enriched);
});

// Set / update budget
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { ...parsed.data, user_id: req.userId! },
      { onConflict: 'user_id,category_id,month,year' }
    )
    .select('*, categories(id, name, icon, color)')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

// Delete budget
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!);

  if (error) {
    res.status(400).json({ error: 'Budget not found' });
    return;
  }

  res.json({ message: 'Budget deleted' });
});

export default router;
