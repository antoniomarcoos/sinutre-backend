import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getStats, getWeightHistory } from '../controllers/stats.controller';

export const statsRouter = Router();

statsRouter.get('/', requireAuth, getStats);
statsRouter.get('/weight', requireAuth, getWeightHistory);