import { PrismaClient } from '@prisma/client';

/** O Prisma usa só `DATABASE_URL` em runtime; host `db.*.supabase.co` costuma falhar fora da VPC (porta 5432). */
function warnIfDatabaseUrlUsesSupabaseDirectHost(): void {
  if (process.env.NODE_ENV === 'production') return;
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return;
  try {
    const normalized = raw.replace(/^postgresql:/i, 'http:').replace(/^postgres:/i, 'http:');
    const { hostname } = new URL(normalized);
    if (/^db\.[^.]+\.supabase\.co$/i.test(hostname)) {
      console.warn(
        '\n[FinTrack] DATABASE_URL está no host direto do Supabase (db.*.supabase.co). ' +
          'O cliente Prisma usa essa URL em todas as queries; em muitas redes isso gera ' +
          '"Can\'t reach database server".\n' +
          '→ Use a URI do **Transaction pooler** (host …pooler.supabase.com, porta 6543, ?pgbouncer=true) em DATABASE_URL.\n' +
          '→ Mantenha o host direto só em DIRECT_URL (migrations). Ver backend/.env.example.\n'
      );
    }
  } catch {
    /* URL inválida — ignorar */
  }
}

warnIfDatabaseUrlUsesSupabaseDirectHost();

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
