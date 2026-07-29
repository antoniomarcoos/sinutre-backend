import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getStats(req: Request, res: Response) {
  const userId = req.userId!;
  const { days = '7' } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - Number(days));

  const meals = await prisma.meal.findMany({
    where: {
      userId,
      eatTime: {
        gte: startDate,
      },
    },
    include: {
      foods: true,
    },
  });

  const dailyStats: Record<string, { calories: number; meals: number }> = {};

  for (const meal of meals) {
    const day = meal.eatTime.toISOString().split('T')[0];
    if (!dailyStats[day]) {
      dailyStats[day] = { calories: 0, meals: 0 };
    }
    const total = meal.foods.reduce((acc, f) => acc + f.calories, 0);
    dailyStats[day].calories += total;
    dailyStats[day].meals += 1;
  }

  const waterLogs = await prisma.waterLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
  });

  const waterStats: Record<string, number> = {};
  for (const log of waterLogs) {
    const day = log.createdAt.toISOString().split('T')[0];
    waterStats[day] = (waterStats[day] || 0) + log.amount;
  }

  const result = [];
  const daysCount = Number(days);
  for (let i = daysCount - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    result.push({
      date: key,
      calories: dailyStats[key]?.calories || 0,
      meals: dailyStats[key]?.meals || 0,
      water: waterStats[key] || 0,
    });
  }

  return res.json(result);
}

export async function getWeightHistory(req: Request, res: Response) {
  const userId = req.userId!;
  const { days = '30' } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const logs = await prisma.weightLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return res.json(logs);
}