// Rota de Gastos Fixos - Fixed Expenses
import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Listar todos os gastos fixos
router.get('/', async (req: Request, res: Response) => {
  try {
    const fixedExpenses = await prisma.fixedExpense.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(fixedExpenses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gastos fixos' });
  }
});

// Criar novo gasto fixo
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, amount, dayOfMonth, category, paymentMethod, active } = req.body;

    if (!name || !amount || !dayOfMonth || !category) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, amount, dayOfMonth, category' });
    }

    const fixedExpense = await prisma.fixedExpense.create({
      data: {
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

// Editar gasto fixo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount, dayOfMonth, category, paymentMethod, active } = req.body;

    const fixedExpense = await prisma.fixedExpense.update({
      where: { id: parseInt(id) },
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao editar gasto fixo' });
  }
});

// Remover gasto fixo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fixedExpense.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover gasto fixo' });
  }
});

export default router;
