// FinTrack - Servidor Backend (TypeScript)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Importar rotas
import fixedIncomesRouter from './routes/fixedIncomes';
import fixedExpensesRouter from './routes/fixedExpenses';
import monthsRouter from './routes/months';
import cardsRouter from './routes/cards';
import installmentsRouter from './routes/installments';
import savingsRouter from './routes/savings';
import dashboardRouter from './routes/dashboard';
import settingsRouter from './routes/settings';
import agentRouter from './routes/agent';

import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware global
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Registrar rotas da API
app.use('/api/fixed-incomes', fixedIncomesRouter);
app.use('/api/fixed-expenses', fixedExpensesRouter);
app.use('/api/months', monthsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/installments', installmentsRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/agent', agentRouter);

// Rota de health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'FinTrack API está rodando!' });
});

// Middleware de erro global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Rota 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║        🏦 FinTrack API Server (TS)     ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  📍 Porta: ${PORT}`);
  console.log('║  🔗 http://localhost:3333');
  console.log('║  ✅ TSX Watch ativo');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
});
