import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { type } = req.query;
    const where = type ? { userId, type: String(type) } : { userId };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const { type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, type' });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'type deve ser income ou expense' });
    }

    const category = await prisma.category.create({
      data: { userId, name, type },
    });

    res.status(201).json(category);
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      return res.status(409).json({ error: 'Categoria já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name } = req.body;

    const existing = await prisma.category.findFirst({
      where: { id: routeParamInt(id), userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    if (!name || name === existing.name) {
      return res.json(existing);
    }

    const category = await prisma.category.update({
      where: { id: existing.id },
      data: { name },
    });

    await prisma.monthEntry.updateMany({
      where: { userId, category: existing.name, type: existing.type },
      data: { category: name },
    });

    if (existing.type === 'income') {
      await prisma.fixedIncome.updateMany({
        where: { userId, category: existing.name },
        data: { category: name },
      });
    } else {
      await prisma.fixedExpense.updateMany({
        where: { userId, category: existing.name },
        data: { category: name },
      });
    }

    await prisma.monthlyBudget.updateMany({
      where: { userId, category: existing.name },
      data: { category: name },
    });

    res.json(category);
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      return res.status(409).json({ error: 'Categoria já existe' });
    }
    res.status(500).json({ error: 'Erro ao editar categoria' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const category = await prisma.category.findFirst({
      where: { id: routeParamInt(req.params.id), userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const [entries, fixedIncomes, fixedExpenses, budgets] = await Promise.all([
      prisma.monthEntry.count({
        where: { userId, category: category.name, type: category.type },
      }),
      category.type === 'income'
        ? prisma.fixedIncome.count({ where: { userId, category: category.name } })
        : 0,
      category.type === 'expense'
        ? prisma.fixedExpense.count({ where: { userId, category: category.name } })
        : 0,
      prisma.monthlyBudget.count({ where: { userId, category: category.name } }),
    ]);

    if (entries > 0 || fixedIncomes > 0 || fixedExpenses > 0 || budgets > 0) {
      return res.status(409).json({ error: 'Categoria em uso; não é possível excluir' });
    }

    await prisma.category.delete({ where: { id: category.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
});

export default router;
