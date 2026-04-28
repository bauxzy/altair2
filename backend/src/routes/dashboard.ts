import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const { month, year } = req.query;
  const m = parseInt(month as string) || now.getMonth() + 1;
  const y = parseInt(year as string) || now.getFullYear();

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];

  // Previous month
  const prevDate = new Date(y, m - 2, 1);
  const prevM = prevDate.getMonth() + 1;
  const prevY = prevDate.getFullYear();
  const prevStart = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
  const prevEnd = new Date(prevY, prevM, 0).toISOString().split('T')[0];

  const [currentMonthTx, prevMonthTx, categoryBreakdown, monthlyTrend] = await Promise.all([
    // Current month transactions
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', req.userId!)
      .gte('date', startDate)
      .lte('date', endDate),

    // Previous month transactions
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', req.userId!)
      .gte('date', prevStart)
      .lte('date', prevEnd),

    // Category breakdown (expenses this month)
    supabase
      .from('transactions')
      .select('amount, categories(id, name, color, icon)')
      .eq('user_id', req.userId!)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate),

    // Last 6 months trend
    supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('user_id', req.userId!)
      .gte('date', new Date(y, m - 7, 1).toISOString().split('T')[0])
      .lte('date', endDate),
  ]);

  // Current month totals
  const currentIncome = (currentMonthTx.data || [])
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const currentExpense = (currentMonthTx.data || [])
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Previous month totals
  const prevIncome = (prevMonthTx.data || [])
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const prevExpense = (prevMonthTx.data || [])
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Category breakdown
  const catMap: Record<string, { name: string; color: string; icon: string; amount: number }> = {};
  (categoryBreakdown.data || []).forEach((t: any) => {
    const cat = t.categories;
    if (!cat) return;
    if (!catMap[cat.id]) {
      catMap[cat.id] = { name: cat.name, color: cat.color, icon: cat.icon, amount: 0 };
    }
    catMap[cat.id].amount += t.amount;
  });

  // Monthly trend (last 6 months)
  const trendMap: Record<string, { income: number; expense: number }> = {};
  (monthlyTrend.data || []).forEach((t: any) => {
    const key = t.date.substring(0, 7); // YYYY-MM
    if (!trendMap[key]) trendMap[key] = { income: 0, expense: 0 };
    trendMap[key][t.type as 'income' | 'expense'] += t.amount;
  });

  const trend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({ month, ...data }));

  // All-time balance
  const { data: allTx } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', req.userId!);

  const totalIncome = (allTx || [])
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpense = (allTx || [])
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  res.json({
    balance: totalIncome - totalExpense,
    currentMonth: {
      income: currentIncome,
      expense: currentExpense,
      savings: currentIncome - currentExpense,
    },
    previousMonth: {
      income: prevIncome,
      expense: prevExpense,
    },
    categoryBreakdown: Object.values(catMap).sort((a, b) => b.amount - a.amount),
    trend,
  });
});

export default router;
