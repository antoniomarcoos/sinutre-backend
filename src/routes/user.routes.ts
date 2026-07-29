import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getGoals, updateGoals, getProfile, updateProfile } from '../controllers/user.controller';

export const userRouter = Router();

userRouter.get('/goals', requireAuth, getGoals);
userRouter.put('/goals', requireAuth, updateGoals);
userRouter.get('/profile', requireAuth, getProfile);
userRouter.put('/profile', requireAuth, updateProfile);