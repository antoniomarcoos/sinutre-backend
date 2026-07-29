import { Request, Response } from 'express';
import { prisma } from '../prisma';

const CATEGORY_MAP: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  lanche: 'Lanche',
  almoco: 'Almoço',
  jantar: 'Jantar',
  ceia: 'Ceia',
  lunch: 'Almoço',
  dinner: 'Jantar',
  breakfast: 'Café da Manhã',
  snack: 'Lanche',
  supper: 'Ceia',
};

function getCategoryLabel(type: string): string {
  return CATEGORY_MAP[type] || type;
}

export async function exportMeals(req: Request, res: Response) {
  const userId = req.userId!;

  const meals = await prisma.meal.findMany({
    where: { userId },
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

  let csv = 'Data,Refeição,Categoria,Calorias,Carboidratos,Proteínas,Gorduras\n';

  for (const meal of meals) {
    const totals = meal.foods.reduce(
      (acc, item) => {
        const factor = item.foodG / 100;
        acc.calories += item.food.caloriesPer100g * factor;
        acc.carbs += item.food.carbsPer100g * factor;
        acc.proteins += item.food.proteinPer100g * factor;
        acc.fats += item.food.fatPer100g * factor;
        return acc;
      },
      { calories: 0, carbs: 0, proteins: 0, fats: 0 }
    );

    const date = new Date(meal.eatTime).toLocaleDateString('pt-BR');
    const category = getCategoryLabel(meal.type);
    csv += `${date},${meal.description || 'Sem descrição'},${category},${Math.round(totals.calories)},${totals.carbs.toFixed(1)},${totals.proteins.toFixed(1)},${totals.fats.toFixed(1)}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=refeicoes.csv');
  res.send(csv);
}

export async function exportWater(req: Request, res: Response) {
  const userId = req.userId!;

  const logs = await prisma.waterLog.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let csv = 'Data,Quantidade (ml)\n';

  for (const log of logs) {
    const date = new Date(log.createdAt).toLocaleDateString('pt-BR');
    csv += `${date},${log.amount}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=agua.csv');
  res.send(csv);
}