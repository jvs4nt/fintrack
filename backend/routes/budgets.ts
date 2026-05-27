import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

function budgetStatus(percent: number): 'ok' | 'warning' | 'exceeded' {
  if (percent >= 100) return 'exceeded';
  if (percent >= 80) return 'warning';
  return 'ok';
}

router.get('/:year/:month', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const year = routeParamInt(req.params.year);
    const month = routeParamInt(req.params.month);

    const [budgets, entries] = await Promise.all([
      prisma.monthlyBudget.findMany({
        where: { userId, year, month },
        orderBy: { category: 'asc' },
      }),
      prisma.monthEntry.findMany({
        where: { userId, year, month, type: 'expense' },
      }),
    ]);

    const spentByCategory: Record<string, number> = {};
    for (const entry of entries) {
      spentByCategory[entry.category] = (spentByCategory[entry.category] ?? 0) + entry.amount;
    }

    const result = budgets.map((b) => {
      const spent = spentByCategory[b.category] ?? 0;
      const percent = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      const status = budgetStatus(percent);
      return {
        category: b.category,
        limit: b.limitAmount,
        spent,
        percent: Math.round(percent * 10) / 10,
        status,
      };
    });

    const alerts = result
      .filter((b) => b.status === 'warning' || b.status === 'exceeded')
      .map((b) => ({
        category: b.category,
        status: b.status as 'warning' | 'exceeded',
        percent: b.percent,
      }));

    res.json({ budgets: result, alerts });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar metas do mês' });
  }
});

router.put('/:year/:month', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const year = routeParamInt(req.params.year);
    const month = routeParamInt(req.params.month);
    const { budgets } = req.body as { budgets: { category: string; limitAmount: number }[] };

    if (!Array.isArray(budgets)) {
      return res.status(400).json({ error: 'budgets deve ser um array' });
    }

    for (const item of budgets) {
      if (!item.category) continue;

      const limitAmount = parseFloat(String(item.limitAmount));
      if (!limitAmount || limitAmount <= 0) {
        await prisma.monthlyBudget.deleteMany({
          where: { userId, year, month, category: item.category },
        });
        continue;
      }

      await prisma.monthlyBudget.upsert({
        where: {
          userId_year_month_category: {
            userId,
            year,
            month,
            category: item.category,
          },
        },
        create: {
          userId,
          year,
          month,
          category: item.category,
          limitAmount,
        },
        update: { limitAmount },
      });
    }

    res.json({ message: 'Metas atualizadas' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar metas do mês' });
  }
});

export default router;
