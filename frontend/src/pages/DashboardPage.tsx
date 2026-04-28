import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import api from '../lib/api';
import { formatCurrency, getMonthShort, percentChange } from '../lib/utils';
import type { DashboardSummary } from '../types';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 text-xs">
      <p className="text-slate-300 mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setSummary(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-white/5 rounded-2xl" />
          <div className="h-72 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!summary) return <div className="text-slate-400">Failed to load dashboard</div>;

  const incomeChange = percentChange(summary.currentMonth.income, summary.previousMonth.income);
  const expenseChange = percentChange(summary.currentMonth.expense, summary.previousMonth.expense);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-0.5">Your financial overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance */}
        <div className="glass p-5 sm:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-altair-500/10 -translate-y-6 translate-x-6" />
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-altair-500/20 flex items-center justify-center">
              <Wallet size={16} className="text-altair-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Balance</span>
          </div>
          <p className="font-display text-3xl font-bold text-white currency">{formatCurrency(summary.balance)}</p>
          <p className="text-slate-500 text-xs mt-1">All time net</p>
        </div>

        {/* Income */}
        <div className="glass p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/10 -translate-y-6 translate-x-6" />
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm">Income</span>
          </div>
          <p className="font-display text-3xl font-bold text-emerald-400 currency">{formatCurrency(summary.currentMonth.income)}</p>
          <div className="flex items-center gap-1 mt-1">
            {incomeChange >= 0
              ? <ArrowUpRight size={13} className="text-emerald-400" />
              : <ArrowDownRight size={13} className="text-red-400" />}
            <span className={`text-xs font-medium ${incomeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.abs(incomeChange).toFixed(1)}% vs last month
            </span>
          </div>
        </div>

        {/* Expense */}
        <div className="glass p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-red-500/10 -translate-y-6 translate-x-6" />
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown size={16} className="text-red-400" />
            </div>
            <span className="text-slate-400 text-sm">Expenses</span>
          </div>
          <p className="font-display text-3xl font-bold text-red-400 currency">{formatCurrency(summary.currentMonth.expense)}</p>
          <div className="flex items-center gap-1 mt-1">
            {expenseChange <= 0
              ? <ArrowDownRight size={13} className="text-emerald-400" />
              : <ArrowUpRight size={13} className="text-red-400" />}
            <span className={`text-xs font-medium ${expenseChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.abs(expenseChange).toFixed(1)}% vs last month
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Trend line chart */}
        <div className="glass p-5 lg:col-span-3">
          <h3 className="font-semibold text-white mb-4">Income vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={summary.trend.map(t => ({ ...t, month: getMonthShort(t.month) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 3 }} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass p-5 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">Spending by Category</h3>
          {summary.categoryBreakdown.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              No expenses this month
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={summary.categoryBreakdown.slice(0, 8)}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {summary.categoryBreakdown.slice(0, 8).map((cat, i) => (
                      <Cell key={i} fill={cat.color || `hsl(${i * 40}, 70%, 55%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                {summary.categoryBreakdown.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color || `hsl(${i * 40}, 70%, 55%)` }} />
                      <span className="text-slate-400 truncate">{cat.icon} {cat.name}</span>
                    </div>
                    <span className="text-slate-300 font-mono shrink-0">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly savings */}
      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Monthly Savings</p>
            <p className={`font-display text-2xl font-bold mt-0.5 ${summary.currentMonth.savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(summary.currentMonth.savings)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Savings rate</p>
            <p className="text-lg font-bold text-white">
              {summary.currentMonth.income > 0
                ? `${((summary.currentMonth.savings / summary.currentMonth.income) * 100).toFixed(1)}%`
                : '—'}
            </p>
          </div>
        </div>
        {summary.currentMonth.income > 0 && (
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${summary.currentMonth.savings >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (summary.currentMonth.expense / summary.currentMonth.income) * 100))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
