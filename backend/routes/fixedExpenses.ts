import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import {
  propagateFixedToEntries,
  PropagateScope,
  clearFixedMonthSkips,
} from '../services/syncFixed';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    res.json(fixedExpenses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gastos fixos' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, amount, dayOfMonth, category, paymentMethod, active } = req.body;

    if (!name || !amount || !dayOfMonth || !category) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, amount, dayOfMonth, category' });
    }

    const fixedExpense = await prisma.fixedExpense.create({
      data: {
        userId,
        name,
        amount: parseFloat(amount),
        dayOfMonth: parseInt(dayOfMonth),
        category,
        paymentMethod: paymentMethod || 'Não especificado',
        active: active !== undefined ? active : true,
      },
    });

    res.status(201).json(fixedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar gasto fixo' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, amount, dayOfMonth, category, paymentMethod, active } = req.body;

    const existing = await prisma.fixedExpense.findFirst({
      where: { id: routeParamInt(id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }

    const fixedExpense = await prisma.fixedExpense.update({
      where: { id: existing.id },
      data: {
        name,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dayOfMonth: dayOfMonth !== undefined ? parseInt(dayOfMonth) : undefined,
        category,
        paymentMethod,
        active,
      },
    });

    res.json(fixedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar gasto fixo' });
  }
});

router.post('/:id/propagate', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { fromYear, fromMonth, scope } = req.body;

    if (!fromYear || !fromMonth || !scope) {
      return res.status(400).json({ error: 'Campos obrigatórios: fromYear, fromMonth, scope' });
    }

    if (scope !== 'from-month' && scope !== 'future-only') {
      return res.status(400).json({ error: 'scope deve ser from-month ou future-only' });
    }

    const { updated } = await propagateFixedToEntries({
      userId,
      fixedType: 'expense',
      fixedId: routeParamInt(id),
      fromYear: parseInt(fromYear),
      fromMonth: parseInt(fromMonth),
      scope: scope as PropagateScope,
    });

    res.json({ updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Fixo não encontrado') {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao propagar lançamentos' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = routeParamInt(req.params.id);

    const existing = await prisma.fixedExpense.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }

    await clearFixedMonthSkips(userId, 'expense', id);
    await prisma.fixedExpense.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover gasto fixo' });
  }
});

export default router;
