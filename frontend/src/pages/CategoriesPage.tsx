import { useEffect, useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { cn } from '../lib/utils';
import type { Category } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  type: z.enum(['income', 'expense', 'both']),
  icon: z.string().default('📦'),
  color: z.string().default('#6366f1'),
});

type FormData = z.infer<typeof schema>;

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b'];
const PRESET_ICONS = ['💰', '🍔', '🛒', '🚗', '🏠', '💡', '🛍️', '🏥', '🎬', '📚', '⛽', '✈️', '💪', '📱', '🏦', '🛡️', '💄', '🎁', '📦', '💼', '💻', '🏢', '📈', '🔄', '↩️'];

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'expense', icon: '📦', color: '#6366f1' },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const fetchCategories = async () => {
    setLoading(true);
    const r = await api.get('/categories');
    setCategories(r.data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const onSubmit = async (data: FormData) => {
    await api.post('/categories', data);
    reset({ type: 'expense', icon: '📦', color: '#6366f1' });
    setShowForm(false);
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await api.delete(`/categories/${id}`);
    setDeleteId(null);
    fetchCategories();
  };

  const filtered = categories.filter(c =>
    filter === 'all' ? true : c.type === filter || c.type === 'both'
  );

  const systemCats = filtered.filter(c => c.is_system);
  const customCats = filtered.filter(c => !c.is_system);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Categories</h2>
          <p className="text-slate-500 text-sm mt-0.5">{categories.length} total categories</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
              filter === f
                ? 'bg-altair-600/20 text-altair-300 border border-altair-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array(12).fill(0).map((_, i) => <div key={i} className="glass h-20 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Custom categories */}
          {customCats.length > 0 && (
            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Custom Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {customCats.map(cat => (
                  <div key={cat.id} className="glass p-4 group flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}40` }}>
                        {cat.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-200 text-sm font-medium truncate">{cat.name}</p>
                        <span className={cn('text-xs capitalize', cat.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                          {cat.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System categories */}
          <div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">System Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {systemCats.map(cat => (
                <div key={cat.id} className="glass p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${cat.color}20` }}>
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-300 text-sm font-medium truncate">{cat.name}</p>
                    <span className={cn('text-xs capitalize', cat.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                      {cat.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md animate-slide-up p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-lg">Add Custom Category</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input {...register('name')} placeholder="e.g. Chai & Coffee" className={cn('input-field', errors.name && 'border-red-500/50')} />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Type</label>
                <select {...register('type')} className="input-field">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {/* Icon picker */}
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setValue('icon', icon)}
                      className={cn(
                        'w-9 h-9 rounded-lg text-lg transition-all',
                        selectedIcon === icon
                          ? 'bg-altair-500/30 border border-altair-500/60 scale-110'
                          : 'bg-white/5 hover:bg-white/10'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('color', color)}
                      className={cn('w-7 h-7 rounded-full transition-all', selectedColor === color ? 'scale-125 ring-2 ring-white/30' : '')}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass p-6 max-w-sm w-full animate-slide-up">
            <h3 className="font-bold text-white text-lg mb-2">Delete Category?</h3>
            <p className="text-slate-400 text-sm mb-5">This will remove the category. Existing transactions won't be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => deleteCategory(deleteId)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
