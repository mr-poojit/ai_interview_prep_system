import { Router, Response } from 'express';
import { z } from 'zod';
import { UserRepository } from '../models/storage.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const AuthCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /api/auth/register
router.post('/register', async (req, res: Response): Promise<void> => {
  const parsed = AuthCredentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message });
    return;
  }

  const { email, password } = parsed.data;
  const existing = await UserRepository.findByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' });
    return;
  }

  const user = await UserRepository.create(email, password);
  const token = UserRepository.createToken(user);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  const parsed = AuthCredentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message });
    return;
  }

  const { email, password } = parsed.data;
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    return;
  }

  const isValid = await UserRepository.verifyPassword(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    return;
  }

  const token = UserRepository.createToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const user = await UserRepository.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

export default router;
