import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import { syncFixedForMonth } from '../services/syncFixed';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/summary/:year/:month', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { year, month } = req.params;
    const yearInt = routeParamInt(year);
    const monthInt = routeParamInt(month);

    await syncFixedForMonth(userId, yearInt, monthInt, { mode: 'create-only' });

    const entries = await prisma.monthEntry.findMany({
      where: { userId, year: yearInt, month: monthInt },
    });

    const totalIncome = entries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = entries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const balance = totalIncome - totalExpense;

    const allInstallments = await prisma.installment.findMany({
      include: { card: true },
      where: { status: 'active', card: { userId } },
    });

    const monthInstallments = allInstallments
      .filter((inst) => {
        const firstDate = new Date(inst.firstPaymentDate);
        const targetMonth = new Date(yearInt, monthInt - 1);
        const monthsDiff =
          (targetMonth.getFullYear() - firstDate.getFullYear()) * 12 +
          (targetMonth.getMonth() - firstDate.getMonth());
        const installmentNumber = monthsDiff + 1;
        return (
          installmentNumber >= inst.currentInstallment &&
          installmentNumber <= inst.totalInstallments &&
          monthsDiff >= 0
        );
      })
      .map((inst) => {
        const firstDate = new Date(inst.firstPaymentDate);
        const monthsDiff =
          (yearInt - firstDate.getFullYear()) * 12 + (monthInt - 1 - firstDate.getMonth());
        return {
          ...inst,
          currentMonthInstallment: monthsDiff + 1,
          installmentAmount: inst.totalAmount / inst.totalInstallments,
        };
      });

    const totalInstallmentsMonth = monthInstallments.reduce(
      (sum, inst) => sum + inst.installmentAmount,
      0
    );

    const cards = await prisma.card.findMany({ where: { userId } });
    const today = new Date();
    const currentDay = today.getDate();

    const nextDueCard = cards
      .map((card) => {
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

    const lastEntries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const sixMonthsData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(yearInt, monthInt - 1 - i);
      const targetYear = targetMonth.getFullYear();
      const targetMonthNum = targetMonth.getMonth() + 1;

      const monthEntries = await prisma.monthEntry.findMany({
        where: { userId, year: targetYear, month: targetMonthNum },
      });

      const monthIncome = monthEntries
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

      const monthExpense = monthEntries
        .filter((e) => e.type === 'expense')
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
      nextDueCard: nextDueCard
        ? {
            name: nextDueCard.name,
            dueDate: nextDueCard.nextDueDate.toISOString().split('T')[0],
            daysUntilDue: nextDueCard.daysUntilDue,
          }
        : null,
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
