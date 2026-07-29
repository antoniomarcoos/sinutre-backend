import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export const foodRouter = Router();

foodRouter.get('/', requireAuth, async (req, res) => {
  const search = String(req.query.search ?? '');
  const foods = await prisma.food.findMany({
    where: {
      userId: req.userId!,
      name: {
        contains: search,
      }
    },
    take: 20,
    orderBy: {
      name: 'asc',
    },
  });

  return res.json(foods);
});

foodRouter.get('/favorites', requireAuth, async (req, res) => {
  const foods = await prisma.food.findMany({
    where: {
      userId: req.userId!,
      isFavorite: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return res.json(foods);
});

foodRouter.get('/all', requireAuth, async (req, res) => {
  const search = String(req.query.search ?? '');
  
  const foods = await prisma.food.findMany({
    where: {
      OR: [
        { userId: req.userId! },
        { userId: null },
      ],
      name: {
        contains: search,
      }
    },
    take: 30,
    orderBy: {
      name: 'asc',
    },
  });

  return res.json(foods);
});

foodRouter.get('/suggest', requireAuth, async (req, res) => {
  const search = String(req.query.q ?? '');
  
  if (search.length < 2) {
    return res.json([]);
  }

  const foods = await prisma.food.findMany({
    where: {
      OR: [
        { userId: req.userId! },
        { userId: null },
      ],
      name: {
        contains: search,
      }
    },
    take: 20,
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

  const existing = await prisma.food.findFirst({
    where: {
      name,
      userId: req.userId,
    },
  });

  if (existing) {
    return res.status(400).json({ error: 'Alimento já cadastrado' });
  }

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

foodRouter.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const foodId = Number(id);

  if (isNaN(foodId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const {
    name,
    caloriesPer100g,
    carbsPer100g,
    proteinPer100g,
    fatPer100g,
    isFavorite,
  } = req.body;

  try {
    const food = await prisma.food.findFirst({
      where: {
        id: foodId,
        userId: req.userId,
      },
    });

    if (!food) {
      return res.status(404).json({ error: 'Alimento não encontrado' });
    }

    const updatedFood = await prisma.food.update({
      where: { id: foodId },
      data: {
        name,
        caloriesPer100g,
        carbsPer100g,
        proteinPer100g,
        fatPer100g,
        isFavorite: isFavorite !== undefined ? isFavorite : food.isFavorite,
      },
    });

    return res.json(updatedFood);
  } catch (error) {
    console.error('Erro ao atualizar alimento:', error);
    return res.status(500).json({ error: 'Erro ao atualizar alimento' });
  }
});

foodRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const foodId = Number(id);

  if (isNaN(foodId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const food = await prisma.food.findFirst({
      where: {
        id: foodId,
        userId: req.userId,
      },
    });

    if (!food) {
      return res.status(404).json({ error: 'Alimento não encontrado' });
    }

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
    console.error('Erro ao excluir alimento:', error);
    return res.status(500).json({ error: 'Erro ao excluir o alimento' });
  }
});