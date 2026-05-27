// FinTrack - Servidor Backend (TypeScript)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import fixedIncomesRouter from './routes/fixedIncomes';
import fixedExpensesRouter from './routes/fixedExpenses';
import monthsRouter from './routes/months';
import cardsRouter from './routes/cards';
import installmentsRouter from './routes/installments';
import savingsRouter from './routes/savings';
import dashboardRouter from './routes/dashboard';
import settingsRouter from './routes/settings';
import agentRouter from './routes/agent';
import categoriesRouter from './routes/categories';
import budgetsRouter from './routes/budgets';
import { requireAuth } from './middleware/auth';

import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3333;

/** Várias origens em dev (ex.: localhost + IP da LAN com `vite --host`). */
function parseCorsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return 'http://localhost:5173';
  if (list.length === 1) return list[0];
  return list;
}

const LAN_VITE_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/;

function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (process.env.NODE_ENV === 'development' && LAN_VITE_ORIGIN.test(origin)) {
    callback(null, true);
    return;
  }
  const allowed = parseCorsOrigins();
  const list = Array.isArray(allowed) ? allowed : [allowed];
  callback(null, list.includes(origin));
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'FinTrack API está rodando!' });
});

app.use('/api', requireAuth);
app.use('/api/fixed-incomes', fixedIncomesRouter);
app.use('/api/fixed-expenses', fixedExpensesRouter);
app.use('/api/months', monthsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/installments', installmentsRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/budgets', budgetsRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║        🏦 FinTrack API Server (TS)     ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  📍 Porta: ${PORT} (0.0.0.0)`);
  console.log(`║  🔗 http://localhost:${PORT}`);
  console.log('║  ✅ Postgres + Supabase Auth');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
});
