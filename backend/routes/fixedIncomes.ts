// Rota de Ganhos Fixos - Fixed Incomes
import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Listar todos os ganhos fixos
router.get('/', async (req: Request, res: Response) => {
  try {
    const fixedIncomes = await prisma.fixedIncome.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(fixedIncomes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ganhos fixos' });
  }
});

// Criar novo ganho fixo
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, amount, dayOfMonth, category, active } = req.body;

    if (!name || !amount || !dayOfMonth || !category) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, amount, dayOfMonth, category' });
    }

    const fixedIncome = await prisma.fixedIncome.create({
      data: {
        name,
        amount: parseFloat(amount),
        dayOfMonth: parseInt(dayOfMonth),
        category,
        active: active !== undefined ? active : true,
      },
    });

    res.status(201).json(fixedIncome);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar ganho fixo' });
  }
});

// Editar ganho fixo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount, dayOfMonth, category, active } = req.body;

    const fixedIncome = await prisma.fixedIncome.update({
      where: { id: parseInt(id) },
      data: {
        name,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dayOfMonth: dayOfMonth !== undefined ? parseInt(dayOfMonth) : undefined,
        category,
        active,
      },
    });

    res.json(fixedIncome);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ganho fixo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao editar ganho fixo' });
  }
});

// Remover ganho fixo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fixedIncome.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ganho fixo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover ganho fixo' });
  }
});

export default router;
