import { useEffect, useState } from 'react';
import { Plus, Trash2, Target, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { formatCurrency, getMonthName } from '../lib/utils';
import { cn } from '../lib/utils';
import type { Budget, Category } from '../types';

const schema = z.object({
  category_id: z.string().uuid('Select a category'),
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});

type FormData = z.infer<typeof schema>;

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { month, year },
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, [month, year]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.filter((c: Category) => c.type === 'expense' || c.type === 'both'))); }, []);

  const onSubmit = async (data: FormData) => {
    await api.post('/budgets', data);
    reset({ month, year });
    setShowForm(false);
    fetchBudgets();
  };

  const deleteBudget = async (id: string) => {
    await api.delete(`/budgets/${id}`);
    fetchBudgets();
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Budgets</h2>
          <p className="text-slate-500 text-sm mt-0.5">Set spending limits by category</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month selector */}
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="input-field text-sm py-2 w-auto"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="input-field text-sm py-2 w-auto"
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Budget
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-sm">Total Budget for {getMonthName(month)}</p>
            <p className="font-display text-2xl font-bold text-white">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Spent</p>
            <p className={`font-display text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', totalSpent > totalBudget ? 'bg-red-500' : totalSpent / totalBudget > 0.8 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Budget list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass h-24 animate-pulse" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass p-12 text-center">
          <Target size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No budgets set for {getMonthName(month)}</p>
          <p className="text-slate-600 text-sm mt-1">Add budgets to track your spending limits</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map(b => {
            const pct = b.percentage || 0;
            const isOver = pct > 100;
            const isWarning = pct > 80 && !isOver;
            return (
              <div key={b.id} className="glass p-4 group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${b.categories?.color || '#6366f1'}20` }}>
                      {b.categories?.icon || '💰'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-200 text-sm font-medium">{b.categories?.name}</p>
                        {isOver && <span className="badge bg-red-500/15 text-red-400"><AlertTriangle size={10} /> Over budget</span>}
                        {isWarning && <span className="badge bg-amber-500/15 text-amber-400"><AlertTriangle size={10} /> Near limit</span>}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {formatCurrency(b.spent || 0)} spent of {formatCurrency(b.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('font-mono text-sm font-bold', isOver ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-300')}>
                      {pct.toFixed(0)}%
                    </span>
                    <button
                      onClick={() => deleteBudget(b.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500')}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-slate-600 text-xs">{formatCurrency(b.spent || 0)}</span>
                  <span className="text-slate-600 text-xs">{formatCurrency(b.amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add budget modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md animate-slide-up p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-lg">Set Budget</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Category</label>
                <select {...register('category_id')} className={cn('input-field', errors.category_id && 'border-red-500/50')}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id.message}</p>}
              </div>

              <div>
                <label className="label">Budget Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input {...register('amount')} type="number" placeholder="0" className="input-field pl-9" />
                </div>
                {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Month</label>
                  <select {...register('month')} className="input-field">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <select {...register('year')} className="input-field">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
