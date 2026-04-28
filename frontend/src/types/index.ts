export interface User {
  id: string;
  email: string;
  user_metadata: { full_name?: string };
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  icon: string;
  color: string;
  is_system: boolean;
  user_id?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category_id: string;
  categories: Category;
  notes?: string;
  payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  categories: Category;
  amount: number;
  month: number;
  year: number;
  spent?: number;
  percentage?: number;
}

export interface DashboardSummary {
  balance: number;
  currentMonth: {
    income: number;
    expense: number;
    savings: number;
  };
  previousMonth: {
    income: number;
    expense: number;
  };
  categoryBreakdown: Array<{
    name: string;
    color: string;
    icon: string;
    amount: number;
  }>;
  trend: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}
