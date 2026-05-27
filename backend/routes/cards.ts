import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const cards = await prisma.card.findMany({
      where: { userId },
      include: {
        installments: {
          where: { status: 'active' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cartões' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, lastFourDigits, color, closingDay, dueDay, limit } = req.body;

    if (!name || !closingDay || !dueDay || !limit) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, closingDay, dueDay, limit' });
    }

    const card = await prisma.card.create({
      data: {
        userId,
        name,
        lastFourDigits,
        color: color || '#1a1a24',
        closingDay: parseInt(closingDay),
        dueDay: parseInt(dueDay),
        limit: parseFloat(limit),
      },
    });

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cartão' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, lastFourDigits, color, closingDay, dueDay, limit } = req.body;

    const existing = await prisma.card.findFirst({
      where: { id: routeParamInt(id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const card = await prisma.card.update({
      where: { id: existing.id },
      data: {
        name,
        lastFourDigits,
        color,
        closingDay: closingDay !== undefined ? parseInt(closingDay) : undefined,
        dueDay: dueDay !== undefined ? parseInt(dueDay) : undefined,
        limit: limit !== undefined ? parseFloat(limit) : undefined,
      },
    });

    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar cartão' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const existing = await prisma.card.findFirst({
      where: { id: routeParamInt(req.params.id), userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    await prisma.card.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover cartão' });
  }
});

export default router;
