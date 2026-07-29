import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { exportMeals, exportWater } from '../controllers/export.controller';

export const exportRouter = Router();

exportRouter.get('/meals', requireAuth, exportMeals);
exportRouter.get('/water', requireAuth, exportWater);