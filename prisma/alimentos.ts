import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const TACO_API_KEY = process.env.TACO_API_KEY;

async function main() {
  console.log('Buscando todos os alimentos da TACO...');

  try {
    let allFoods: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get('https://taco.codivatech.com/api/foods', {
        headers: {
          'x-api-key': TACO_API_KEY || '',
          'Content-Type': 'application/json',
        },
        params: {
          page: page,
          per_page: 100,
        },
        timeout: 30000,
      });

      let pageData = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        pageData = response.data.results;
      } else if (Array.isArray(response.data)) {
        pageData = response.data;
      }

      if (pageData.length === 0) {
        break;
      }

      allFoods = [...allFoods, ...pageData];
      console.log(`Página ${page}: ${pageData.length} alimentos`);

      const totalPages = response.data?.meta?.total_pages || 0;
      hasMore = page < totalPages;
      page++;
    }

    console.log(`Total: ${allFoods.length} alimentos encontrados`);

    let count = 0;
    for (const item of allFoods) {
      if (!item.description) continue;

      const existing = await prisma.food.findFirst({
        where: {
          name: item.description,
          userId: null,
        },
      });

      if (existing) continue;

      await prisma.food.create({
        data: {
          name: item.description,
          caloriesPer100g: parseFloat(item.kcal) || 0,
          carbsPer100g: parseFloat(item.carbohydrate) || 0,
          proteinPer100g: parseFloat(item.protein) || 0,
          fatPer100g: parseFloat(item.lipids) || 0,
          userId: null,
        },
      });
      count++;
    }

    console.log(`${count} novos alimentos importados com sucesso`);
    console.log(`Total de alimentos no banco: ${await prisma.food.count()}`);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();