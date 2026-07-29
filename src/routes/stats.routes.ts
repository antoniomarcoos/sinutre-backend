import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getStats } from '../controllers/stats.controller';

export const statsRouter = Router();

statsRouter.get('/', requireAuth, getStats);