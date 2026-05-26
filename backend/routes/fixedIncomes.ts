import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import {
  propagateFixedToEntries,
  PropagateScope,
  clearFixedMonthSkips,
} from '../services/syncFixed';
import { validateFixedCreateBase } from '../lib/parseFixedCreate';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const fixedIncomes = await prisma.fixedIncome.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    res.json(fixedIncomes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ganhos fixos' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const parsed = validateFixedCreateBase((req.body ?? {}) as Record<string, unknown>);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const { name, category, amount, dayOfMonth, active } = parsed.data;

    const fixedIncome = await prisma.fixedIncome.create({
      data: {
        userId,
        name,
        amount,
        dayOfMonth,
        category,
        active,
      },
    });

    res.status(201).json(fixedIncome);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar ganho fixo' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, amount, dayOfMonth, category, active } = req.body;

    const existing = await prisma.fixedIncome.findFirst({
      where: { id: routeParamInt(id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Ganho fixo não encontrado' });
    }

    const fixedIncome = await prisma.fixedIncome.update({
      where: { id: existing.id },
      data: {
        name,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dayOfMonth: dayOfMonth !== undefined ? parseInt(dayOfMonth) : undefined,
        category,
        active,
      },
    });

    res.json(fixedIncome);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar ganho fixo' });
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
      fixedType: 'income',
      fixedId: routeParamInt(id),
      fromYear: parseInt(fromYear),
      fromMonth: parseInt(fromMonth),
      scope: scope as PropagateScope,
    });

    res.json({ updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Fixo não encontrado') {
      return res.status(404).json({ error: 'Ganho fixo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao propagar lançamentos' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = routeParamInt(req.params.id);

    const existing = await prisma.fixedIncome.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Ganho fixo não encontrado' });
    }

    await clearFixedMonthSkips(userId, 'income', id);
    await prisma.fixedIncome.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover ganho fixo' });
  }
});

export default router;
