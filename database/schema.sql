-- =============================================
-- Altair 2.0 - Supabase Database Schema
-- Run this in your Supabase SQL editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#6366f1',
  is_system BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system categories and own categories"
  ON categories FOR SELECT
  USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (user_id = auth.uid() AND is_system = false);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  notes TEXT,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- BUDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- RLS for budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- SEED SYSTEM CATEGORIES
-- =============================================
INSERT INTO categories (name, type, icon, color, is_system) VALUES
  -- Expense categories
  ('Food & Dining', 'expense', '🍔', '#f97316', true),
  ('Groceries', 'expense', '🛒', '#84cc16', true),
  ('Transport / Auto', 'expense', '🚗', '#06b6d4', true),
  ('Rent', 'expense', '🏠', '#8b5cf6', true),
  ('Utilities', 'expense', '💡', '#f59e0b', true),
  ('Shopping', 'expense', '🛍️', '#ec4899', true),
  ('Healthcare', 'expense', '🏥', '#ef4444', true),
  ('Entertainment', 'expense', '🎬', '#a855f7', true),
  ('Swiggy / Zomato', 'expense', '🍕', '#f97316', true),
  ('Education', 'expense', '📚', '#3b82f6', true),
  ('Fuel', 'expense', '⛽', '#f59e0b', true),
  ('Travel', 'expense', '✈️', '#06b6d4', true),
  ('Gym / Fitness', 'expense', '💪', '#10b981', true),
  ('Subscriptions', 'expense', '📱', '#6366f1', true),
  ('EMI / Loan', 'expense', '🏦', '#dc2626', true),
  ('Insurance', 'expense', '🛡️', '#64748b', true),
  ('Personal Care', 'expense', '💄', '#f43f5e', true),
  ('Gifts', 'expense', '🎁', '#8b5cf6', true),
  ('Miscellaneous', 'expense', '📦', '#94a3b8', true),

  -- Income categories
  ('Salary', 'income', '💼', '#10b981', true),
  ('Freelance', 'income', '💻', '#3b82f6', true),
  ('Business', 'income', '🏢', '#f59e0b', true),
  ('Investment Returns', 'income', '📈', '#10b981', true),
  ('Rental Income', 'income', '🏠', '#8b5cf6', true),
  ('Bonus', 'income', '🎯', '#f97316', true),
  ('Gift / Transfer', 'income', '🎁', '#ec4899', true),
  ('Refund', 'income', '↩️', '#06b6d4', true),
  ('Other Income', 'income', '💰', '#64748b', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
