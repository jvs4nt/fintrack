import prisma from '../prisma/client';

export type SyncMode = 'create-only' | 'upsert';
export type PropagateScope = 'from-month' | 'future-only';

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

function buildFixedDate(year: number, month: number, dayOfMonth: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function isFixedSkipped(
  userId: string,
  year: number,
  month: number,
  type: string,
  fixedRefId: number
): Promise<boolean> {
  const skip = await prisma.fixedMonthSkip.findUnique({
    where: {
      userId_year_month_type_fixedRefId: {
        userId,
        year,
        month,
        type,
        fixedRefId,
      },
    },
  });
  return skip !== null;
}

export async function syncFixedForMonth(
  userId: string,
  year: number,
  month: number,
  options: { mode?: SyncMode } = {}
): Promise<{ created: number; updated: number }> {
  const mode = options.mode ?? 'create-only';
  let created = 0;
  let updated = 0;

  const fixedIncomes = await prisma.fixedIncome.findMany({
    where: { userId, active: true },
  });
  const fixedExpenses = await prisma.fixedExpense.findMany({
    where: { userId, active: true },
  });

  for (const income of fixedIncomes) {
    const result = await upsertFixedEntry({
      userId,
      year,
      month,
      type: 'income',
      fixedRefId: income.id,
      description: income.name,
      amount: income.amount,
      category: income.category,
      dayOfMonth: income.dayOfMonth,
      mode,
    });
    created += result.created;
    updated += result.updated;
  }

  for (const expense of fixedExpenses) {
    const result = await upsertFixedEntry({
      userId,
      year,
      month,
      type: 'expense',
      fixedRefId: expense.id,
      description: expense.name,
      amount: expense.amount,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      dayOfMonth: expense.dayOfMonth,
      mode,
    });
    created += result.created;
    updated += result.updated;
  }

  return { created, updated };
}

async function upsertFixedEntry(params: {
  userId: string;
  year: number;
  month: number;
  type: 'income' | 'expense';
  fixedRefId: number;
  description: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  paymentMethod?: string;
  mode: SyncMode;
}): Promise<{ created: number; updated: number }> {
  const skipped = await isFixedSkipped(
    params.userId,
    params.year,
    params.month,
    params.type,
    params.fixedRefId
  );
  if (skipped) {
    return { created: 0, updated: 0 };
  }

  const existing = await prisma.monthEntry.findFirst({
    where: {
      userId: params.userId,
      year: params.year,
      month: params.month,
      type: params.type,
      fixedRefId: params.fixedRefId,
    },
  });

  const date = buildFixedDate(params.year, params.month, params.dayOfMonth);

  if (!existing) {
    await prisma.monthEntry.create({
      data: {
        userId: params.userId,
        year: params.year,
        month: params.month,
        type: params.type,
        description: params.description,
        amount: params.amount,
        date,
        category: params.category,
        paymentMethod: params.paymentMethod,
        isFixed: true,
        fixedRefId: params.fixedRefId,
      },
    });
    return { created: 1, updated: 0 };
  }

  if (params.mode === 'upsert') {
    await prisma.monthEntry.update({
      where: { id: existing.id },
      data: {
        description: params.description,
        amount: params.amount,
        date,
        category: params.category,
        paymentMethod: params.paymentMethod,
      },
    });
    return { created: 0, updated: 1 };
  }

  return { created: 0, updated: 0 };
}

export async function recordFixedMonthSkip(
  userId: string,
  year: number,
  month: number,
  type: string,
  fixedRefId: number
): Promise<void> {
  await prisma.fixedMonthSkip.upsert({
    where: {
      userId_year_month_type_fixedRefId: {
        userId,
        year,
        month,
        type,
        fixedRefId,
      },
    },
    create: { userId, year, month, type, fixedRefId },
    update: {},
  });
}

export async function clearFixedMonthSkips(
  userId: string,
  type: 'income' | 'expense',
  fixedRefId: number
): Promise<void> {
  await prisma.fixedMonthSkip.deleteMany({
    where: { userId, type, fixedRefId },
  });
}

export async function propagateFixedToEntries(params: {
  userId: string;
  fixedType: 'income' | 'expense';
  fixedId: number;
  fromYear: number;
  fromMonth: number;
  scope: PropagateScope;
}): Promise<{ updated: number }> {
  const fromIndex = monthIndex(params.fromYear, params.fromMonth);

  const fixed =
    params.fixedType === 'income'
      ? await prisma.fixedIncome.findFirst({
          where: { id: params.fixedId, userId: params.userId },
        })
      : await prisma.fixedExpense.findFirst({
          where: { id: params.fixedId, userId: params.userId },
        });

  if (!fixed) {
    throw new Error('Fixo não encontrado');
  }

  const entries = await prisma.monthEntry.findMany({
    where: {
      userId: params.userId,
      type: params.fixedType,
      fixedRefId: params.fixedId,
      isFixed: true,
    },
  });

  let updated = 0;

  for (const entry of entries) {
    const entryIndex = monthIndex(entry.year, entry.month);
    const inScope =
      params.scope === 'from-month' ? entryIndex >= fromIndex : entryIndex > fromIndex;

    if (!inScope) continue;

    const date = buildFixedDate(entry.year, entry.month, fixed.dayOfMonth);
    const data: {
      description: string;
      amount: number;
      date: string;
      category: string;
      paymentMethod?: string;
    } = {
      description: fixed.name,
      amount: fixed.amount,
      date,
      category: fixed.category,
    };

    if (params.fixedType === 'expense') {
      data.paymentMethod = (fixed as unknown as { paymentMethod: string }).paymentMethod;
    }

    await prisma.monthEntry.update({
      where: { id: entry.id },
      data,
    });
    updated++;
  }

  return { updated };
}
