// Rota de Parcelamentos - Installments
import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Listar todos os parcelamentos
router.get('/', async (req: Request, res: Response) => {
  try {
    const installments = await prisma.installment.findMany({
      include: {
        card: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(installments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar parcelamentos' });
  }
});

// Buscar parcelas que vencem em um mês específico
router.get('/month/:year/:month', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);

    const installments = await prisma.installment.findMany({
      include: {
        card: true,
      },
      where: {
        status: 'active',
      },
    });

    // Filtrar parcelas que vencem no mês
    const monthInstallments = installments.filter(inst => {
      const firstDate = new Date(inst.firstPaymentDate);
      const targetMonth = new Date(yearInt, monthInt - 1);

      // Calcular qual parcela vence neste mês
      const monthsDiff = (targetMonth.getFullYear() - firstDate.getFullYear()) * 12 +
                         (targetMonth.getMonth() - firstDate.getMonth());

      const installmentNumber = monthsDiff + 1;

      return installmentNumber >= inst.currentInstallment &&
             installmentNumber <= inst.totalInstallments &&
             monthsDiff >= 0;
    }).map(inst => {
      const firstDate = new Date(inst.firstPaymentDate);
      const monthsDiff = (yearInt - firstDate.getFullYear()) * 12 + (monthInt - 1 - firstDate.getMonth());
      const installmentNumber = monthsDiff + 1;

      return {
        ...inst,
        currentMonthInstallment: installmentNumber,
        installmentAmount: inst.totalAmount / inst.totalInstallments,
      };
    });

    res.json(monthInstallments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar parcelas do mês' });
  }
});

// Criar novo parcelamento
router.post('/', async (req: Request, res: Response) => {
  try {
    const { description, totalAmount, totalInstallments, firstPaymentDate, cardId, currentInstallment } = req.body;

    if (!description || !totalAmount || !totalInstallments || !firstPaymentDate || !cardId) {
      return res.status(400).json({ error: 'Campos obrigatórios: description, totalAmount, totalInstallments, firstPaymentDate, cardId' });
    }

    const installment = await prisma.installment.create({
      data: {
        description,
        totalAmount: parseFloat(totalAmount),
        totalInstallments: parseInt(totalInstallments),
        currentInstallment: currentInstallment || 1,
        firstPaymentDate,
        cardId: parseInt(cardId),
        status: 'active',
      },
      include: {
        card: true,
      },
    });

    res.status(201).json(installment);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar parcelamento' });
  }
});

// Editar parcelamento
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, totalAmount, totalInstallments, currentInstallment, status } = req.body;

    const installment = await prisma.installment.update({
      where: { id: parseInt(id) },
      data: {
        description,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
        totalInstallments: totalInstallments !== undefined ? parseInt(totalInstallments) : undefined,
        currentInstallment: currentInstallment !== undefined ? parseInt(currentInstallment) : undefined,
        status,
      },
      include: {
        card: true,
      },
    });

    res.json(installment);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Parcelamento não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao editar parcelamento' });
  }
});

// Remover parcelamento
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.installment.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Parcelamento não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover parcelamento' });
  }
});

export default router;
