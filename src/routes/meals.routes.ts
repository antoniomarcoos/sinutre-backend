import { Router } from 'express';
import { createMeal, meals, getMeal, deleteMeal, updateMeal } from '../controllers/meals.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const mealsRoutes = Router();

mealsRoutes.post('/', requireAuth, createMeal);
mealsRoutes.get('/', requireAuth, meals);
mealsRoutes.get('/:id', requireAuth, getMeal);
mealsRoutes.put('/:id', requireAuth, updateMeal);
mealsRoutes.delete('/:id', requireAuth, deleteMeal);