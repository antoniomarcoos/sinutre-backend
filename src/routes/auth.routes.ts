import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { me } from '../controllers/auth.me';

import {
  redirectToGithub,
  githubCallback,
  redirectToGoogle,
  googleCallback, 
} from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.get('/github', redirectToGithub);
authRoutes.get('/github/callback', githubCallback);

authRoutes.get('/google', redirectToGoogle);
authRoutes.get('/google/callback', googleCallback);

authRoutes.get('/me', requireAuth, me);