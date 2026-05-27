// FinTrack - Seed do Banco de Dados (requer usuário autenticado)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.error('❌ Defina SEED_USER_ID no .env (UUID do usuário em Supabase Auth).');
    process.exit(1);
  }

  console.log('🌱 Iniciando seed do FinTrack para usuário', userId);

  await prisma.savingHistory.deleteMany({ where: { saving: { userId } } });
  await prisma.saving.deleteMany({ where: { userId } });
  await prisma.installment.deleteMany({ where: { card: { userId } } });
  await prisma.card.deleteMany({ where: { userId } });
  await prisma.fixedMonthSkip.deleteMany({ where: { userId } });
  await prisma.monthEntry.deleteMany({ where: { userId } });
  await prisma.monthlyBudget.deleteMany({ where: { userId } });
  await prisma.fixedExpense.deleteMany({ where: { userId } });
  await prisma.fixedIncome.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });

  console.log('🗑️  Dados do usuário limpos');

  const incomeCategories = ['Trabalho', 'Extra', 'Investimento', 'Aluguel', 'Outros'];
  const expenseCategories = [
    'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação',
    'Entretenimento', 'Vestuário', 'Serviços', 'Assinaturas', 'Outros',
  ];

  for (const name of incomeCategories) {
    await prisma.category.create({ data: { userId, name, type: 'income' } });
  }
  for (const name of expenseCategories) {
    await prisma.category.create({ data: { userId, name, type: 'expense' } });
  }

  await prisma.settings.upsert({
    where: { userId },
    create: { userId, payday: 5 },
    update: { payday: 5 },
  });

  const salary = await prisma.fixedIncome.create({
    data: {
      userId,
      name: 'Salário',
      amount: 8500.0,
      dayOfMonth: 5,
      category: 'Trabalho',
      active: true,
    },
  });

  await prisma.fixedIncome.create({
    data: {
      userId,
      name: 'Freelance',
      amount: 2000.0,
      dayOfMonth: 15,
      category: 'Extra',
      active: true,
    },
  });

  await prisma.fixedExpense.create({
    data: {
      userId,
      name: 'Aluguel',
      amount: 2500.0,
      dayOfMonth: 10,
      category: 'Moradia',
      paymentMethod: 'PIX',
      active: true,
    },
  });

  await prisma.fixedExpense.create({
    data: {
      userId,
      name: 'Netflix',
      amount: 55.9,
      dayOfMonth: 20,
      category: 'Entretenimento',
      paymentMethod: 'Cartão de Crédito',
      active: true,
    },
  });

  const nubankCard = await prisma.card.create({
    data: {
      userId,
      name: 'Nubank Ultravioleta',
      lastFourDigits: '4829',
      color: '#6c19c9',
      closingDay: 25,
      dueDay: 5,
      limit: 15000.0,
    },
  });

  await prisma.installment.create({
    data: {
      description: 'MacBook Pro M3',
      totalAmount: 12000.0,
      totalInstallments: 12,
      currentInstallment: 3,
      firstPaymentDate: '2026-01-05',
      cardId: nubankCard.id,
      status: 'active',
    },
  });

  const savingsAccount = await prisma.saving.create({
    data: {
      userId,
      name: 'Reserva de Emergência',
      institution: 'Nubank',
      type: 'poupanca',
      amount: 25000.0,
    },
  });

  await prisma.savingHistory.create({
    data: { savingId: savingsAccount.id, amount: savingsAccount.amount },
  });

  console.log('✅ Seed finalizado. Ganho fixo exemplo:', salary.name);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
