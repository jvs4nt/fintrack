// Rota de Dashboard - Resumo e Estatísticas
import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Buscar resumo completo do mês para o dashboard
router.get('/summary/:year/:month', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);

    // Primeiro, garantir que os fixos foram sincronizados
    const fixedIncomes = await prisma.fixedIncome.findMany({
      where: { active: true },
    });

    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: { active: true },
    });

    // Sincronizar se necessário
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
      }
    }

    // Buscar lançamentos do mês
    const entries = await prisma.monthEntry.findMany({
      where: {
        year: yearInt,
        month: monthInt,
      },
    });

    // Calcular totais
    const totalIncome = entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const balance = totalIncome - totalExpense;

    // Buscar parcelas do mês
    const allInstallments = await prisma.installment.findMany({
      include: { card: true },
      where: { status: 'active' },
    });

    const monthInstallments = allInstallments.filter(inst => {
      const firstDate = new Date(inst.firstPaymentDate);
      const targetMonth = new Date(yearInt, monthInt - 1);
      const monthsDiff = (targetMonth.getFullYear() - firstDate.getFullYear()) * 12 +
                         (targetMonth.getMonth() - firstDate.getMonth());
      const installmentNumber = monthsDiff + 1;
      return installmentNumber >= inst.currentInstallment &&
             installmentNumber <= inst.totalInstallments &&
             monthsDiff >= 0;
    }).map(inst => {
      const firstDate = new Date(inst.firstPaymentDate);
      const monthsDiff = (yearInt - firstDate.getFullYear()) * 12 + (monthInt - 1 - firstDate.getMonth());
      return {
        ...inst,
        currentMonthInstallment: monthsDiff + 1,
        installmentAmount: inst.totalAmount / inst.totalInstallments,
      };
    });

    // Total de parcelas no mês
    const totalInstallmentsMonth = monthInstallments.reduce(
      (sum, inst) => sum + inst.installmentAmount,
      0
    );

    // Buscar próximos vencimentos de cartão
    const cards = await prisma.card.findMany();
    const today = new Date();
    const currentDay = today.getDate();

    const nextDueCard: any = cards
      .map(card => {
        let dueDate = new Date(today.getFullYear(), today.getMonth(), card.dueDay);
        if (card.dueDay < currentDay) {
          dueDate = new Date(today.getFullYear(), today.getMonth() + 1, card.dueDay);
        }
        return {
          ...card,
          nextDueDate: dueDate,
          daysUntilDue: Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)[0];

    // Últimos 5 lançamentos
    const lastEntries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Dados para gráfico dos últimos 6 meses
    const sixMonthsData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(yearInt, monthInt - 1 - i);
      const targetYear = targetMonth.getFullYear();
      const targetMonthNum = targetMonth.getMonth() + 1;

      const monthEntries = await prisma.monthEntry.findMany({
        where: {
          year: targetYear,
          month: targetMonthNum,
        },
      });

      const monthIncome = monthEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

      const monthExpense = monthEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

      sixMonthsData.push({
        month: targetMonthNum,
        year: targetYear,
        label: targetMonth.toLocaleDateString('pt-BR', { month: 'short' }),
        income: monthIncome,
        expense: monthExpense,
      });
    }

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        balance,
        totalInstallments: totalInstallmentsMonth,
        netBalance: balance - totalInstallmentsMonth,
      },
      nextDueCard: nextDueCard ? {
        name: nextDueCard.name,
        dueDate: nextDueCard.nextDueDate.toISOString().split('T')[0],
        daysUntilDue: nextDueCard.daysUntilDue,
      } : null,
      lastEntries,
      sixMonthsData,
      monthInstallments,
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo do dashboard' });
  }
});

export default router;
