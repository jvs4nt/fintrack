import prisma from '../prisma/client';

export type SyncMode = 'create-only' | 'upsert';
export type PropagateScope = 'from-month' | 'future-only';

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

function clampDayOfMonth(dayOfMonth: number): number {
  const d = Number(dayOfMonth);
  if (!Number.isFinite(d)) return 1;
  return Math.min(Math.max(Math.floor(d), 1), 31);
}

function buildFixedDate(year: number, month: number, dayOfMonth: number): string {
  const safeDay = clampDayOfMonth(dayOfMonth);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(safeDay, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export async function syncFixedForMonth(
  userId: string,
  year: number,
  month: number,
  options: { mode?: SyncMode } = {}
): Promise<{ created: number; updated: number }> {
  const mode = options.mode ?? 'create-only';
  const [fixedIncomes, fixedExpenses, existingEntries, skips] = await Promise.all([
    prisma.fixedIncome.findMany({ where: { userId, active: true } }),
    prisma.fixedExpense.findMany({ where: { userId, active: true } }),
    prisma.monthEntry.findMany({
      where: {
        userId,
        year,
        month,
        isFixed: true,
        fixedRefId: { not: null },
      },
      select: { id: true, type: true, fixedRefId: true },
    }),
    prisma.fixedMonthSkip.findMany({
      where: { userId, year, month },
      select: { type: true, fixedRefId: true },
    }),
  ]);

  /** Mesmo fixo não pode ter dois MonthEntry no mês; duplicatas antigas (race/sync legado) são removidas. */
  const keyToEntryIds = new Map<string, number[]>();
  for (const entry of existingEntries) {
    if (entry.fixedRefId == null) continue;
    const key = `${entry.type}:${entry.fixedRefId}`;
    const bucket = keyToEntryIds.get(key) ?? [];
    bucket.push(entry.id);
    keyToEntryIds.set(key, bucket);
  }

  const idsToDelete: number[] = [];
  for (const ids of keyToEntryIds.values()) {
    if (ids.length <= 1) continue;
    const sorted = [...ids].sort((a, b) => a - b);
    idsToDelete.push(...sorted.slice(1));
  }

  if (idsToDelete.length > 0) {
    await prisma.monthEntry.deleteMany({
      where: { userId, id: { in: idsToDelete } },
    });
  }

  const deletedSet = new Set(idsToDelete);
  const existingByKey = new Map<string, { id: number }>();
  for (const entry of existingEntries) {
    if (entry.fixedRefId == null) continue;
    if (deletedSet.has(entry.id)) continue;
    existingByKey.set(`${entry.type}:${entry.fixedRefId}`, { id: entry.id });
  }

  const skipKeys = new Set<string>(
    skips.map((skip) => `${skip.type}:${skip.fixedRefId}`)
  );

  const creates: Array<{
    userId: string;
    year: number;
    month: number;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: string;
    category: string;
    paymentMethod?: string;
    isFixed: true;
    fixedRefId: number;
  }> = [];
  const updates: Array<{
    id: number;
    data: {
      description: string;
      amount: number;
      date: string;
      category: string;
      paymentMethod?: string;
    };
  }> = [];

  const enqueueFixed = (params: {
    type: 'income' | 'expense';
    fixedRefId: number;
    description: string;
    amount: number;
    category: string;
    dayOfMonth: number;
    paymentMethod?: string;
  }) => {
    if (!Number.isFinite(params.amount)) {
      throw new Error(
        `Valor (amount) inválido no fixo ${params.type} id=${params.fixedRefId}. Edite o cadastro do fixo.`
      );
    }

    const key = `${params.type}:${params.fixedRefId}`;
    if (skipKeys.has(key)) return;

    const date = buildFixedDate(year, month, params.dayOfMonth);
    const existing = existingByKey.get(key);

    if (!existing) {
      creates.push({
        userId,
        year,
        month,
        type: params.type,
        description: params.description,
        amount: params.amount,
        date,
        category: params.category,
        paymentMethod: params.paymentMethod,
        isFixed: true,
        fixedRefId: params.fixedRefId,
      });
      return;
    }

    if (mode === 'upsert') {
      updates.push({
        id: existing.id,
        data: {
          description: params.description,
          amount: params.amount,
          date,
          category: params.category,
          paymentMethod: params.paymentMethod,
        },
      });
    }
  };

  for (const income of fixedIncomes) {
    enqueueFixed({
      type: 'income',
      fixedRefId: income.id,
      description: income.name,
      amount: income.amount,
      category: income.category,
      dayOfMonth: income.dayOfMonth,
    });
  }

  for (const expense of fixedExpenses) {
    enqueueFixed({
      type: 'expense',
      fixedRefId: expense.id,
      description: expense.name,
      amount: expense.amount,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      dayOfMonth: expense.dayOfMonth,
    });
  }

  let created = 0;
  let updated = 0;

  if (creates.length > 0) {
    const result = await prisma.monthEntry.createMany({ data: creates });
    created = result.count;
  }

  if (mode === 'upsert' && updates.length > 0) {
    await Promise.all(
      updates.map((update) =>
        prisma.monthEntry.update({
          where: { id: update.id },
          data: update.data,
        })
      )
    );
    updated = updates.length;
  }

  return { created, updated };
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
