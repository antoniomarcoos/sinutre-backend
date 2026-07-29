import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getGoals(req: Request, res: Response) {
  const userId = req.userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      caloriesGoal: true,
      waterGoal: true,
    },
  });

  return res.json(user);
}

export async function updateGoals(req: Request, res: Response) {
  const userId = req.userId!;
  const { caloriesGoal, waterGoal } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      caloriesGoal: caloriesGoal || 2000,
      waterGoal: waterGoal || 2000,
    },
    select: {
      caloriesGoal: true,
      waterGoal: true,
    },
  });

  return res.json(user);
}

export async function getProfile(req: Request, res: Response) {
  const userId = req.userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      avatarUrl: true,
      gender: true,
    },
  });

  const weightLog = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    ...user,
    weight: weightLog?.weight || null,
    height: weightLog?.height || null,
  });
}

export async function updateProfile(req: Request, res: Response) {
  const userId = req.userId!;
  const { name, birthDate, gender, weight, height } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || undefined,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      gender: gender || undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      avatarUrl: true,
      gender: true,
    },
  });

  if (weight || height) {
    await prisma.weightLog.create({
      data: {
        userId,
        weight: weight || 0,
        height: height || 0,
      },
    });
  }

  return res.json(user);
}