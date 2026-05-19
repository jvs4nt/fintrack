import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Buscar configurações globais
router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 }
    });
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1, payday: 1 }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar settings:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Atualizar payday
router.put('/', async (req: Request, res: Response) => {
  try {
    const { payday } = req.body;
    
    if (payday === undefined) {
      return res.status(400).json({ error: 'Campo payday é obrigatório' });
    }

    const paydayInt = parseInt(payday);
    if (isNaN(paydayInt) || paydayInt < 1 || paydayInt > 31) {
      return res.status(400).json({ error: 'Payday deve ser um número entre 1 e 31' });
    }

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { payday: paydayInt },
      create: { id: 1, payday: paydayInt }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Erro ao atualizar settings:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

export default router;
