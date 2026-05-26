import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import {
  syncFixedForMonth,
  SyncMode,
  recordFixedMonthSkip,
} from '../services/syncFixed';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/:year/:month', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { year, month } = req.params;

    const entries = await prisma.monthEntry.findMany({
      where: {
        userId,
        year: routeParamInt(year),
        month: routeParamInt(month),
      },
      orderBy: { date: 'asc' },
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lançamentos do mês' });
  }
});

router.post('/:year/:month/sync-fixed', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { year, month } = req.params;
    const mode = (req.body?.mode as SyncMode) ?? 'create-only';

    const yearInt = routeParamInt(year);
    const monthInt = routeParamInt(month);
    if (!Number.isFinite(yearInt) || !Number.isFinite(monthInt) || monthInt < 1 || monthInt > 12) {
      return res.status(400).json({ error: 'Ano ou mês inválido' });
    }

    const { created, updated } = await syncFixedForMonth(userId, yearInt, monthInt, { mode });

    res.json({
      message: 'Sync concluído',
      created,
      updated,
    });
  } catch (error) {
    console.error('sync-fixed:', error);
    const details = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: 'Erro ao sincronizar lançamentos fixos',
      ...(process.env.NODE_ENV !== 'production' ? { details } : {}),
    });
  }
});

router.post('/entry', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { year, month, type, description, amount, date, category, paymentMethod, note, isFixed } =
      req.body;

    const entry = await prisma.monthEntry.create({
      data: {
        userId,
        year: routeParamInt(year),
        month: routeParamInt(month),
        type,
        description,
        amount: parseFloat(amount),
        date,
        category,
        paymentMethod,
        note,
        isFixed: isFixed || false,
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar lançamento' });
  }
});

router.put('/entry/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.monthEntry.findFirst({
      where: { id: routeParamInt(id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    const entry = await prisma.monthEntry.update({
      where: { id: existing.id },
      data: {
        ...data,
        year: data.year ? parseInt(data.year) : undefined,
        month: data.month ? parseInt(data.month) : undefined,
        amount: data.amount ? parseFloat(data.amount) : undefined,
      },
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar lançamento' });
  }
});

router.delete('/entry/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const entry = await prisma.monthEntry.findFirst({
      where: { id: routeParamInt(id), userId },
    });
    if (!entry) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    if (entry.isFixed && entry.fixedRefId != null) {
      await recordFixedMonthSkip(
        userId,
        entry.year,
        entry.month,
        entry.type,
        entry.fixedRefId
      );
    }

    await prisma.monthEntry.delete({ where: { id: entry.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover lançamento' });
  }
});

export default router;
