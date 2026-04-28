import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import api from '../lib/api';
import { cn, PAYMENT_MODES } from '../lib/utils';
import type { Transaction, Category } from '../types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Must be positive'),
  date: z.string().min(1, 'Date required'),
  category_id: z.string().uuid('Select a category'),
  notes: z.string().max(500).optional(),
  payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  transaction?: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TransactionModal({ transaction, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: transaction?.type || 'expense',
      amount: transaction?.amount,
      date: transaction?.date || new Date().toISOString().split('T')[0],
      category_id: transaction?.category_id,
      notes: transaction?.notes || '',
      payment_mode: transaction?.payment_mode || 'upi',
    },
  });

  const txType = watch('type');

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  const filteredCategories = categories.filter(
    c => c.type === txType || c.type === 'both'
  );

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, data);
      } else {
        await api.post('/transactions', data);
      }
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-display font-bold text-white text-lg">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>
          )}

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 p-1 gap-1 bg-white/[0.02]">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setValue('type', t); setValue('category_id', '' as any); }}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  txType === t
                    ? t === 'expense'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {t === 'expense' ? '💸 Expense' : '💰 Income'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg">₹</span>
              <input
                {...register('amount')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={cn('input-field pl-10 font-mono text-lg', errors.amount && 'border-red-500/50')}
              />
            </div>
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input
              {...register('date')}
              type="date"
              className={cn('input-field', errors.date && 'border-red-500/50')}
            />
            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              {...register('category_id')}
              className={cn('input-field', errors.category_id && 'border-red-500/50')}
            >
              <option value="">Select category</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id.message}</p>}
          </div>

          {/* Payment mode */}
          <div>
            <label className="label">Payment Mode</label>
            <div className="grid grid-cols-5 gap-2">
              {PAYMENT_MODES.map(pm => (
                <label key={pm.value} className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl border cursor-pointer transition-all',
                  watch('payment_mode') === pm.value
                    ? 'border-altair-500/60 bg-altair-500/10 text-altair-300'
                    : 'border-white/10 hover:border-white/20 text-slate-500 hover:text-slate-300'
                )}>
                  <input {...register('payment_mode')} type="radio" value={pm.value} className="sr-only" />
                  <span className="text-lg">{pm.icon}</span>
                  <span className="text-[10px] font-medium leading-tight text-center">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              {...register('notes')}
              placeholder="Add a note..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
