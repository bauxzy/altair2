import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  category_id: z.string().uuid('Invalid category ID'),
  notes: z.string().max(500).optional(),
  payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other']),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['income', 'expense', 'both']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const budgetSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
