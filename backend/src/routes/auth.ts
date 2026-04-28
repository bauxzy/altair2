import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { signupSchema, loginSchema } from '../lib/schemas';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Sign up
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  const { email, password, full_name } = parsed.data;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ message: 'Account created successfully', user: data.user });
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  const { email, password } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.json({ session: data.session, user: data.user });
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data: { user }, error } = await supabase.auth.admin.getUserById(req.userId!);

  if (error || !user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

// Logout (client-side mostly, but we invalidate)
router.post('/logout', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
