import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function createWaterLog(req: Request, res: Response) {
  const { amount } = req.body;
  const userId = req.userId!;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Quantidade inválida' });
  }

  const log = await prisma.waterLog.create({
    data: {
      amount,
      userId,
    },
  });

  return res.status(201).json(log);
}

export async function getWaterLogs(req: Request, res: Response) {
  const userId = req.userId!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await prisma.waterLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: today,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = logs.reduce((acc, log) => acc + log.amount, 0);

  return res.json({ logs, total, goal: 2000 });
}