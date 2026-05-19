// Rota de Reservas Financeiras - Savings
import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Listar todas as reservas
router.get('/', async (req: Request, res: Response) => {
  try {
    const savings = await prisma.saving.findMany({
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

// Criar nova reserva
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, institution, type, amount } = req.body;

    if (!name || !type || !amount) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, type, amount' });
    }

    const saving = await prisma.saving.create({
      data: {
        name,
        institution: institution || 'Não especificado',
        type,
        amount: parseFloat(amount),
      },
    });

    // Criar primeiro registro no histórico
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

// Editar reserva
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, institution, type } = req.body;

    const saving = await prisma.saving.update({
      where: { id: parseInt(id) },
      data: {
        name,
        institution,
        type,
      },
    });

    res.json(saving);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao editar reserva' });
  }
});

// Atualizar valor da reserva (com histórico)
router.patch('/:id/amount', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Campo obrigatório: amount' });
    }

    // Atualizar valor da reserva
    const saving = await prisma.saving.update({
      where: { id: parseInt(id) },
      data: {
        amount: parseFloat(amount),
      },
    });

    // Registrar no histórico
    await prisma.savingHistory.create({
      data: {
        savingId: saving.id,
        amount: saving.amount,
      },
    });

    res.json(saving);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao atualizar valor da reserva' });
  }
});

// Buscar histórico de uma reserva
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await prisma.savingHistory.findMany({
      where: { savingId: parseInt(id) },
      orderBy: { date: 'desc' },
      take: 10,
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Remover reserva
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.saving.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao remover reserva' });
  }
});

export default router;
