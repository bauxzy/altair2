import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Filter, Pencil, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { TransactionModal } from '../components/TransactionModal';
import type { Transaction, Category, TransactionFilters } from '../types';

const LIMIT = 20;

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (filters.type) params.append('type', filters.type);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.search) params.append('search', filters.search);

      const r = await api.get(`/transactions?${params}`);
      setTransactions(r.data.transactions || []);
      setTotal(r.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data)); }, []);

  const handleDelete = async (id: string) => {
    await api.delete(`/transactions/${id}`);
    setDeleteId(null);
    fetchTransactions();
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const response = await api.get(`/transactions/export/csv?${params}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'altair-transactions.csv';
    a.click();
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Transactions</h2>
          <p className="text-slate-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-ghost flex items-center gap-2 text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => { setEditTx(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search notes..."
              value={filters.search || ''}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setOffset(0); }}
              className="input-field pl-9 text-sm py-2.5"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost flex items-center gap-2 text-sm ${showFilters ? 'text-altair-300 bg-altair-500/10' : ''}`}
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <select
              value={filters.type || ''}
              onChange={e => { setFilters(f => ({ ...f, type: e.target.value as any || undefined })); setOffset(0); }}
              className="input-field text-sm py-2"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              value={filters.category_id || ''}
              onChange={e => { setFilters(f => ({ ...f, category_id: e.target.value || undefined })); setOffset(0); }}
              className="input-field text-sm py-2"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>

            <input
              type="date"
              value={filters.start_date || ''}
              onChange={e => { setFilters(f => ({ ...f, start_date: e.target.value || undefined })); setOffset(0); }}
              className="input-field text-sm py-2"
              placeholder="From"
            />

            <input
              type="date"
              value={filters.end_date || ''}
              onChange={e => { setFilters(f => ({ ...f, end_date: e.target.value || undefined })); setOffset(0); }}
              className="input-field text-sm py-2"
              placeholder="To"
            />
          </div>
        )}
      </div>

      {/* Table / List */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-9 h-9 bg-white/5 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-white/5 rounded" />
                  <div className="h-2.5 w-20 bg-white/5 rounded" />
                </div>
                <div className="h-4 w-20 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-medium">No transactions found</p>
            <p className="text-sm mt-1">Add your first transaction to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors group">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${tx.categories?.color || '#6366f1'}20` }}>
                  {tx.categories?.icon || '💰'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 text-sm font-medium truncate">
                      {tx.categories?.name || 'Unknown'}
                    </span>
                    <span className={`badge text-[10px] hidden sm:inline-flex ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                      {tx.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs">{formatDate(tx.date)}</span>
                    {tx.notes && <span className="text-slate-600 text-xs truncate max-w-[120px]">· {tx.notes}</span>}
                    <span className="text-slate-600 text-xs capitalize hidden sm:inline">· {tx.payment_mode?.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Amount */}
                <span className={`font-mono font-semibold text-sm shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => { setEditTx(tx); setModalOpen(true); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(tx.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-slate-500 text-sm">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
                className="btn-ghost py-1.5 px-2.5 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={offset + LIMIT >= total}
                onClick={() => setOffset(o => o + LIMIT)}
                className="btn-ghost py-1.5 px-2.5 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <TransactionModal
          transaction={editTx}
          onClose={() => { setModalOpen(false); setEditTx(null); }}
          onSaved={() => { setModalOpen(false); setEditTx(null); fetchTransactions(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass p-6 max-w-sm w-full animate-slide-up">
            <h3 className="font-bold text-white text-lg mb-2">Delete Transaction?</h3>
            <p className="text-slate-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
