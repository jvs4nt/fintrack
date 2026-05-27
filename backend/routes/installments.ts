import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const installments = await prisma.installment.findMany({
      where: { card: { userId } },
      include: { card: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(installments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar parcelamentos' });
  }
});

router.get('/month/:year/:month', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { year, month } = req.params;
    const yearInt = routeParamInt(year);
    const monthInt = routeParamInt(month);

    const installments = await prisma.installment.findMany({
      include: { card: true },
      where: {
        status: 'active',
        card: { userId },
      },
    });

    const monthInstallments = installments
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

    res.json(monthInstallments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar parcelas do mês' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { description, totalAmount, totalInstallments, firstPaymentDate, cardId, currentInstallment } =
      req.body;

    if (!description || !totalAmount || !totalInstallments || !firstPaymentDate || !cardId) {
      return res.status(400).json({
        error: 'Campos obrigatórios: description, totalAmount, totalInstallments, firstPaymentDate, cardId',
      });
    }

    const card = await prisma.card.findFirst({
      where: { id: parseInt(cardId), userId },
    });
    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const installment = await prisma.installment.create({
      data: {
        description,
        totalAmount: parseFloat(totalAmount),
        totalInstallments: parseInt(totalInstallments),
        currentInstallment: currentInstallment || 1,
        firstPaymentDate,
        cardId: card.id,
        status: 'active',
      },
      include: { card: true },
    });

    res.status(201).json(installment);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar parcelamento' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { description, totalAmount, totalInstallments, currentInstallment, status } = req.body;

    const existing = await prisma.installment.findFirst({
      where: { id: routeParamInt(id), card: { userId } },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' });
    }

    const installment = await prisma.installment.update({
      where: { id: existing.id },
      data: {
        description,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
        totalInstallments:
          totalInstallments !== undefined ? parseInt(totalInstallments) : undefined,
        currentInstallment:
          currentInstallment !== undefined ? parseInt(currentInstallment) : undefined,
        status,
      },
      include: { card: true },
    });

    res.json(installment);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar parcelamento' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const existing = await prisma.installment.findFirst({
      where: { id: routeParamInt(req.params.id), card: { userId } },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' });
    }

    await prisma.installment.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover parcelamento' });
  }
});

export default router;
