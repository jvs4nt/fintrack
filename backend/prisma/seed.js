// FinTrack - Seed do Banco de Dados
// Popula o banco com dados de exemplo para demonstração

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do FinTrack...');

  // Limpar banco existente
  await prisma.savingHistory.deleteMany();
  await prisma.saving.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.card.deleteMany();
  await prisma.monthEntry.deleteMany();
  await prisma.fixedExpense.deleteMany();
  await prisma.fixedIncome.deleteMany();

  console.log('🗑️  Banco limpo');

  // Criar Ganhos Fixos
  const salary = await prisma.fixedIncome.create({
    data: {
      name: 'Salário',
      amount: 8500.00,
      dayOfMonth: 5,
      category: 'Trabalho',
      active: true,
    },
  });

  const freelance = await prisma.fixedIncome.create({
    data: {
      name: 'Freelance',
      amount: 2000.00,
      dayOfMonth: 15,
      category: 'Extra',
      active: true,
    },
  });

  console.log('💰 Ganhos fixos criados');

  // Criar Gastos Fixos
  const rent = await prisma.fixedExpense.create({
    data: {
      name: 'Aluguel',
      amount: 2500.00,
      dayOfMonth: 10,
      category: 'Moradia',
      paymentMethod: 'PIX',
      active: true,
    },
  });

  const netflix = await prisma.fixedExpense.create({
    data: {
      name: 'Netflix',
      amount: 55.90,
      dayOfMonth: 20,
      category: 'Entretenimento',
      paymentMethod: 'Cartão de Crédito',
      active: true,
    },
  });

  const gym = await prisma.fixedExpense.create({
    data: {
      name: 'Academia',
      amount: 149.90,
      dayOfMonth: 1,
      category: 'Saúde',
      paymentMethod: 'Cartão de Crédito',
      active: true,
    },
  });

  console.log('💸 Gastos fixos criados');

  // Criar Cartão de Crédito
  const nubankCard = await prisma.card.create({
    data: {
      name: 'Nubank Ultravioleta',
      lastFourDigits: '4829',
      color: '#6c19c9',
      closingDay: 25,
      dueDay: 5,
      limit: 15000.00,
    },
  });

  console.log('💳 Cartão criado');

  // Criar Parcelamento
  const installment = await prisma.installment.create({
    data: {
      description: 'MacBook Pro M3',
      totalAmount: 12000.00,
      totalInstallments: 12,
      currentInstallment: 3,
      firstPaymentDate: '2026-01-05',
      cardId: nubankCard.id,
      status: 'active',
    },
  });

  console.log('📦 Parcelamento criado');

  // Criar Reservas
  const savingsAccount = await prisma.saving.create({
    data: {
      name: 'Reserva de Emergência',
      institution: 'Nubank',
      type: 'poupanca',
      amount: 25000.00,
    },
  });

  // Adicionar histórico para a reserva
  await prisma.savingHistory.create({
    data: {
      savingId: savingsAccount.id,
      amount: 25000.00,
      date: new Date(),
    },
  });

  const treasuryDirect = await prisma.saving.create({
    data: {
      name: 'Tesouro IPCA+',
      institution: 'Banco do Brasil',
      type: 'tesouro',
      amount: 15000.00,
    },
  });

  await prisma.savingHistory.create({
    data: {
      savingId: treasuryDirect.id,
      amount: 15000.00,
      date: new Date(),
    },
  });

  console.log('🏦 Reservas criadas');

  console.log('✅ Seed finalizado com sucesso!');
  console.log('');
  console.log('📊 Resumo:');
  console.log(`   - Ganhos fixos: R$ ${(salary.amount + freelance.amount).toFixed(2)}`);
  console.log(`   - Gastos fixos: R$ ${(rent.amount + netflix.amount + gym.amount).toFixed(2)}`);
  console.log(`   - Cartões: 1 (Nubank Ultravioleta)`);
  console.log(`   - Parcelamentos: 1 (12x de R$ 1.000,00)`);
  console.log(`   - Reservas: R$ ${(savingsAccount.amount + treasuryDirect.amount).toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
