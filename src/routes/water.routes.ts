import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { createWaterLog, getWaterLogs } from '../controllers/water.controller';

export const waterRouter = Router();

waterRouter.post('/', requireAuth, createWaterLog);
waterRouter.get('/', requireAuth, getWaterLogs);