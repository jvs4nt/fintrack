import express, { Request, Response } from 'express';
import prisma from '../prisma/client';
import { getUserId, routeParamInt } from '../types/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    let settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { userId, payday: 1 },
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar settings:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { payday } = req.body;

    if (payday === undefined) {
      return res.status(400).json({ error: 'Campo payday é obrigatório' });
    }

    const paydayInt = parseInt(payday);
    if (isNaN(paydayInt) || paydayInt < 1 || paydayInt > 31) {
      return res.status(400).json({ error: 'Payday deve ser um número entre 1 e 31' });
    }

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: { payday: paydayInt },
      create: { userId, payday: paydayInt },
    });

    res.json(settings);
  } catch (error) {
    console.error('Erro ao atualizar settings:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

export default router;
