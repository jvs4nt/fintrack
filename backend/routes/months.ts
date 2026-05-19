// Rota de Lançamentos Mensais - Month Entries (TypeScript)
import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Buscar todos os lançamentos de um mês específico
router.get('/:year/:month', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;

    const entries = await prisma.monthEntry.findMany({
      where: {
        year: parseInt(year),
        month: parseInt(month),
      },
      orderBy: { date: 'asc' },
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lançamentos do mês' });
  }
});

// Sincronizar lançamentos fixos no mês
router.post('/:year/:month/sync-fixed', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);

    const fixedIncomes = await prisma.fixedIncome.findMany({
      where: { active: true },
    });

    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: { active: true },
    });

    let createdCount = 0;

    for (const income of fixedIncomes) {
      const existing = await prisma.monthEntry.findFirst({
        where: {
          year: yearInt,
          month: monthInt,
          type: 'income',
          fixedRefId: income.id,
        },
      });

      if (!existing) {
        await prisma.monthEntry.create({
          data: {
            year: yearInt,
            month: monthInt,
            type: 'income',
            description: income.name,
            amount: income.amount,
            date: `${year}-${String(month).padStart(2, '0')}-${String(income.dayOfMonth).padStart(2, '0')}`,
            category: income.category,
            isFixed: true,
            fixedRefId: income.id,
          },
        });
        createdCount++;
      }
    }

    for (const expense of fixedExpenses) {
      const existing = await prisma.monthEntry.findFirst({
        where: {
          year: yearInt,
          month: monthInt,
          type: 'expense',
          fixedRefId: expense.id,
        },
      });

      if (!existing) {
        await prisma.monthEntry.create({
          data: {
            year: yearInt,
            month: monthInt,
            type: 'expense',
            description: expense.name,
            amount: expense.amount,
            date: `${year}-${String(month).padStart(2, '0')}-${String(expense.dayOfMonth).padStart(2, '0')}`,
            category: expense.category,
            paymentMethod: expense.paymentMethod,
            isFixed: true,
            fixedRefId: expense.id,
          },
        });
        createdCount++;
      }
    }

    res.json({
      message: `Sync concluído`,
      created: createdCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao sincronizar lançamentos fixos' });
  }
});

// Criar lançamento avulso
router.post('/entry', async (req: Request, res: Response) => {
  try {
    const { year, month, type, description, amount, date, category, paymentMethod, note, isFixed } = req.body;

    const entry = await prisma.monthEntry.create({
      data: {
        year: parseInt(year),
        month: parseInt(month),
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

// Editar lançamento
router.put('/entry/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const entry = await prisma.monthEntry.update({
      where: { id: parseInt(id) },
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

// Remover lançamento
router.delete('/entry/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.monthEntry.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover lançamento' });
  }
});

export default router;
