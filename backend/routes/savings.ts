import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const savings = await prisma.saving.findMany({
      where: { userId },
      include: {
        history: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(savings);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, institution, type, amount } = req.body;

    if (!name || !type || !amount) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, type, amount' });
    }

    const saving = await prisma.saving.create({
      data: {
        userId,
        name,
        institution: institution || 'Não especificado',
        type,
        amount: parseFloat(amount),
      },
    });

    await prisma.savingHistory.create({
      data: {
        savingId: saving.id,
        amount: saving.amount,
      },
    });

    res.status(201).json(saving);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar reserva' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const existing = await prisma.saving.findFirst({
      where: { id: routeParamInt(req.params.id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const { name, institution, type } = req.body;
    const saving = await prisma.saving.update({
      where: { id: existing.id },
      data: { name, institution, type },
    });

    res.json(saving);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar reserva' });
  }
});

router.patch('/:id/amount', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Campo obrigatório: amount' });
    }

    const existing = await prisma.saving.findFirst({
      where: { id: routeParamInt(req.params.id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const saving = await prisma.saving.update({
      where: { id: existing.id },
      data: { amount: parseFloat(amount) },
    });

    await prisma.savingHistory.create({
      data: {
        savingId: saving.id,
        amount: saving.amount,
      },
    });

    res.json(saving);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar valor da reserva' });
  }
});

router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const saving = await prisma.saving.findFirst({
      where: { id: routeParamInt(req.params.id), userId },
    });
    if (!saving) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const history = await prisma.savingHistory.findMany({
      where: { savingId: saving.id },
      orderBy: { date: 'desc' },
      take: 10,
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const existing = await prisma.saving.findFirst({
      where: { id: routeParamInt(req.params.id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    await prisma.saving.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover reserva' });
  }
});

export default router;
