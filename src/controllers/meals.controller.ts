import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function meals(
  req: Request,
  res: Response,
) {
  const userId = req.userId!;
  const { startDate, endDate, type } = req.query;

  const where: any = { userId };

  if (startDate) {
    where.eatTime = {
      ...where.eatTime,
      gte: new Date(String(startDate)),
    };
  }

  if (endDate) {
    where.eatTime = {
      ...where.eatTime,
      lte: new Date(String(endDate)),
    };
  }

  if (type && type !== 'todos') {
    where.type = String(type);
  }

  const meals = await prisma.meal.findMany({
    where,
    include: {
      foods: {
        include: {
          food: true,
        },
      },
    },
    orderBy: {
      eatTime: 'desc',
    },
  });

  const result = meals.map((meal) => {
    const totals = meal.foods.reduce(
      (acc, item) => {
        const factor = item.foodG / 100;
        acc.grams += item.foodG;
        acc.calories += item.food.caloriesPer100g * factor;
        acc.carbs += item.food.carbsPer100g * factor;
        acc.proteins += item.food.proteinPer100g * factor;
        acc.fats += item.food.fatPer100g * factor;
        return acc;
      },
      { grams: 0, calories: 0, carbs: 0, proteins: 0, fats: 0 },
    );

    return {
      id: meal.id,
      name: meal.description,
      type: meal.type,
      createdAt: meal.createdAt,
      eatTime: meal.eatTime,
      totals,
      items: meal.foods,
    };
  });

  return res.json(result);
}

export async function createMeal(
  req: Request,
  res: Response,
) {
  const userId = req.userId!;
  const { type, eatTime, description, items } = req.body;

  const parsedDate = new Date(eatTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'Data inválida.' });
  }

  const meal = await prisma.$transaction(async (tx) => {
    const foods = await tx.food.findMany({
      where: {
        id: { in: items.map((i: { foodId: number }) => i.foodId) },
        OR: [{ userId }, { userId: null }],
      },
    });

    if (foods.length !== items.length) {
      throw new Error('Alimento não encontrado');
    }

    const meal = await tx.meal.create({
      data: { type, eatTime: parsedDate, description, userId },
    });

    await tx.mealFood.createMany({
      data: items.map((item: { foodId: number; grams: number }) => {
        const food = foods.find((f) => f.id === item.foodId)!;
        return {
          mealId: meal.id,
          foodId: food.id,
          foodG: item.grams,
          calories: (food.caloriesPer100g * item.grams) / 100,
          carbs: (food.carbsPer100g * item.grams) / 100,
          protein: (food.proteinPer100g * item.grams) / 100,
          fat: (food.fatPer100g * item.grams) / 100,
        };
      }),
    });

    return meal;
  });

  return res.status(201).json(meal);
}

export async function createMealFromSuggest(
  req: Request,
  res: Response,
) {
  const userId = req.userId!;
  const { nome, alimentos, categoria } = req.body;

  try {
    const meal = await prisma.meal.create({
      data: {
        description: nome,
        type: categoria || 'lunch',
        eatTime: new Date(),
        userId,
      },
    });

    const alimentosData = [];

    for (const a of alimentos) {
      const food = await prisma.food.findFirst({
        where: {
          name: {
            contains: a.nome,
          },
          OR: [
            { userId },
            { userId: null },
          ],
        },
      });

      if (!food) {
        console.warn(`Alimento não encontrado: ${a.nome}`);
        continue;
      }

      alimentosData.push({
        mealId: meal.id,
        foodId: food.id,
        foodG: a.quantidade,
        calories: (food.caloriesPer100g * a.quantidade) / 100,
        carbs: (food.carbsPer100g * a.quantidade) / 100,
        protein: (food.proteinPer100g * a.quantidade) / 100,
        fat: (food.fatPer100g * a.quantidade) / 100,
      });
    }

    if (alimentosData.length === 0) {
      await prisma.meal.delete({ where: { id: meal.id } });
      return res.status(400).json({ error: 'Nenhum alimento encontrado para salvar' });
    }

    await prisma.mealFood.createMany({
      data: alimentosData,
    });

    return res.status(201).json(meal);
  } catch (error) {
    console.error('Erro ao salvar sugestão:', error);
    return res.status(500).json({ error: 'Erro ao salvar refeição' });
  }
}

export async function getMeal(
  req: Request,
  res: Response,
) {
  const { id } = req.params;
  const mealId = parseInt(id, 10);

  if (isNaN(mealId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const meal = await prisma.meal.findFirst({
      where: { id: mealId, userId: req.userId },
      include: { foods: { include: { food: true } } },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Refeição não encontrada' });
    }

    const totals = meal.foods.reduce(
      (acc, item) => {
        const factor = item.foodG / 100;
        acc.grams += item.foodG;
        acc.calories += item.food.caloriesPer100g * factor;
        acc.carbs += item.food.carbsPer100g * factor;
        acc.proteins += item.food.proteinPer100g * factor;
        acc.fats += item.food.fatPer100g * factor;
        return acc;
      },
      { grams: 0, calories: 0, carbs: 0, proteins: 0, fats: 0 },
    );

    return res.json({
      id: meal.id,
      name: meal.description,
      type: meal.type,
      createdAt: meal.createdAt,
      eatTime: meal.eatTime,
      totals,
      items: meal.foods,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar refeição' });
  }
}

export async function deleteMeal(
  req: Request,
  res: Response,
) {
  const { id } = req.params;
  const mealId = parseInt(id, 10);

  if (isNaN(mealId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const meal = await prisma.meal.findFirst({
      where: { id: mealId, userId: req.userId },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Refeição não encontrada' });
    }

    await prisma.mealFood.deleteMany({ where: { mealId } });
    await prisma.meal.delete({ where: { id: mealId } });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir refeição' });
  }
}

export async function updateMeal(
  req: Request,
  res: Response,
) {
  const { id } = req.params;
  const mealId = parseInt(id, 10);

  if (isNaN(mealId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const { type, eatTime, description, items } = req.body;

  try {
    const meal = await prisma.meal.findFirst({
      where: { id: mealId, userId: req.userId },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Refeição não encontrada' });
    }

    const parsedDate = new Date(eatTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Data inválida.' });
    }

    const updatedMeal = await prisma.$transaction(async (tx) => {
      await tx.mealFood.deleteMany({ where: { mealId } });

      if (items && items.length > 0) {
        const foods = await tx.food.findMany({
          where: {
            id: { in: items.map((i: { foodId: number }) => i.foodId) },
            OR: [{ userId: req.userId }, { userId: null }],
          },
        });

        if (foods.length !== items.length) {
          throw new Error('Alimento não encontrado');
        }

        await tx.mealFood.createMany({
          data: items.map((item: { foodId: number; grams: number }) => {
            const food = foods.find((f) => f.id === item.foodId)!;
            return {
              mealId,
              foodId: food.id,
              foodG: item.grams,
              calories: (food.caloriesPer100g * item.grams) / 100,
              carbs: (food.carbsPer100g * item.grams) / 100,
              protein: (food.proteinPer100g * item.grams) / 100,
              fat: (food.fatPer100g * item.grams) / 100,
            };
          }),
        });
      }

      return tx.meal.update({
        where: { id: mealId },
        data: { type, eatTime: parsedDate, description },
      });
    });

    return res.json(updatedMeal);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar refeição' });
  }
}