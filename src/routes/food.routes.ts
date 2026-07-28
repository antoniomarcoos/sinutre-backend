import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export const foodRouter = Router();

//foods/
foodRouter.get('/', requireAuth, async (req, res) => {
  const search = String(req.query.search ?? '');
  const foods = await prisma.food.findMany({
    where: {
      userId: req.userId!,
      name: {
        contains: search,
      }
    },
    take: 10,
    orderBy: {
      name: 'asc',
    },
  });

  return res.json(foods);
});


foodRouter.post('/', requireAuth, async (req, res) => {
  const {
    name,
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
  } = req.body;

  const food = await prisma.food.create({
    data: {
      name,
      caloriesPer100g,
      carbsPer100g,
      proteinPer100g,
      fatPer100g,
      userId: req.userId!,
    },
  });

  return res.status(201).json(food);
});

// deleta o alimento pelo id que vem na url
foodRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const foodId = Number(id);

  try {
    await prisma.mealFood.deleteMany({
      where: {
        foodId: foodId,
      },
    });

    await prisma.food.delete({
      where: {
        id: foodId,
      },
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao excluir o alimento' });
  }
});