// Rota de Cartões de Crédito - Cards
import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Listar todos os cartões com parcelamentos
router.get('/', async (req: Request, res: Response) => {
  try {
    const cards = await prisma.card.findMany({
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

// Criar novo cartão
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, lastFourDigits, color, closingDay, dueDay, limit } = req.body;

    if (!name || !closingDay || !dueDay || !limit) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, closingDay, dueDay, limit' });
    }

    const card = await prisma.card.create({
      data: {
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

// Editar cartão
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, lastFourDigits, color, closingDay, dueDay, limit } = req.body;

    const card = await prisma.card.update({
      where: { id: parseInt(id) },
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao editar cartão' });
  }
});

// Remover cartão
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.card.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover cartão' });
  }
});

export default router;
