import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

type EntryType = 'income' | 'expense';
type Intent = 'add_entry' | 'delete_entry' | 'update_entry' | 'summary' | 'unknown';

interface PendingAction {
  action: 'delete_entry';
  entryId: number;
  preview: string;
}

interface AgentRequestBody {
  message?: string;
  pendingAction?: PendingAction | null;
}

interface AgentResponse {
  message: string;
  intention: Intent;
  dataCaptured: Record<string, unknown>;
  pendencias: string[];
  action: string;
  result: string;
  needsConfirmation?: boolean;
  pendingAction?: PendingAction | null;
  options?: Array<{ id: number; label: string }>;
}

const YES_WORDS = new Set(['sim', 's', 'confirmar', 'confirmo', 'pode', 'ok', 'pode remover', 'pode excluir']);

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseAmount(message: string): number | null {
  const amountRegex = /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|\d+(?:[.,]\d{1,2})?)/;
  const match = message.match(amountRegex);
  if (!match) return null;

  const normalized = match[1].replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseDate(message: string): Date {
  const normalized = normalizeText(message);
  const now = new Date();

  if (normalized.includes('hoje')) return now;
  if (normalized.includes('ontem')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  const dateMatch = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (!dateMatch) return now;

  const day = Number.parseInt(dateMatch[1], 10);
  const month = Number.parseInt(dateMatch[2], 10);
  const year = dateMatch[3]
    ? Number.parseInt(dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3], 10)
    : now.getFullYear();

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? now : parsed;
}

function formatDateISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function detectType(message: string): EntryType | null {
  const normalized = normalizeText(message);
  if (/\b(gasto|gastei|despesa|saida|saída)\b/.test(normalized)) return 'expense';
  if (/\b(ganho|receita|entrada|recebi)\b/.test(normalized)) return 'income';
  return null;
}

function detectIntent(message: string): Intent {
  const normalized = normalizeText(message);
  if (/\b(resumo|saldo|movimentacoes|movimentacoes|movimentação|movimentacoes)\b/.test(normalized)) return 'summary';
  if (/\b(remove|remover|excluir|apagar|tirar)\b/.test(normalized)) return 'delete_entry';
  if (/\b(editar|edita|corrige|corrigir|atualizar|atualiza)\b/.test(normalized)) return 'update_entry';
  if (/\b(adicionar|adiciona|inserir|inserir|lancar|lançar|gastei|recebi)\b/.test(normalized)) return 'add_entry';
  return 'unknown';
}

function extractDescription(message: string): string | null {
  const normalized = normalizeText(message);

  const patterns = [
    /(?:no|na|de|do)\s+([a-z0-9\s]+)/,
    /(?:gasto|receita|ganho|despesa)\s+(?:de\s+)?[0-9.,]+\s+([a-z0-9\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const value = match[1]
        .replace(/\b(hoje|ontem)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (value.length >= 2) return value;
    }
  }

  return null;
}

function parseCategory(message: string, type: EntryType): string {
  const normalized = normalizeText(message);

  const expenseCategories = ['moradia', 'alimentacao', 'transporte', 'saude', 'educacao', 'entretenimento', 'servicos', 'assinaturas'];
  const incomeCategories = ['trabalho', 'extra', 'investimento', 'aluguel'];

  const source = type === 'expense' ? expenseCategories : incomeCategories;
  const found = source.find((item) => normalized.includes(item));
  if (found) return found.charAt(0).toUpperCase() + found.slice(1);
  return 'Outros';
}

async function findCandidateEntries(message: string, expectedType: EntryType | null) {
  const normalized = normalizeText(message);
  const amount = parseAmount(message);
  const description = extractDescription(message);
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 90);

  const candidates = await prisma.monthEntry.findMany({
    where: {
      createdAt: {
        gte: from,
      },
      type: expectedType ?? undefined,
      amount: amount ?? undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const filtered = candidates.filter((entry) => {
    if (!description) return true;
    const entryText = normalizeText(`${entry.description} ${entry.category} ${entry.note ?? ''}`);
    return entryText.includes(description);
  });

  if (normalized.includes('ultima') || normalized.includes('última')) {
    return filtered.slice(0, 1);
  }

  return filtered.slice(0, 5);
}

function buildBaseResponse(partial: Partial<AgentResponse>): AgentResponse {
  return {
    message: partial.message ?? 'Não entendi sua solicitação.',
    intention: partial.intention ?? 'unknown',
    dataCaptured: partial.dataCaptured ?? {},
    pendencias: partial.pendencias ?? [],
    action: partial.action ?? 'nenhuma',
    result: partial.result ?? 'sem execução',
    needsConfirmation: partial.needsConfirmation,
    pendingAction: partial.pendingAction ?? null,
    options: partial.options,
  };
}

router.post('/chat', async (req: Request<unknown, unknown, AgentRequestBody>, res: Response<AgentResponse>) => {
  try {
    const message = req.body.message?.trim() ?? '';
    const pendingAction = req.body.pendingAction ?? null;
    const normalized = normalizeText(message);

    if (!message) {
      return res.status(400).json(
        buildBaseResponse({
          message: 'Envie uma mensagem para eu poder te ajudar.',
          pendencias: ['Mensagem vazia'],
          result: 'erro de validação',
        }),
      );
    }

    if (pendingAction?.action === 'delete_entry') {
      const confirmed = YES_WORDS.has(normalized);
      if (!confirmed) {
        return res.json(
          buildBaseResponse({
            intention: 'delete_entry',
            message: 'Tudo bem, não removi o lançamento. Se quiser, me diga qual item deseja remover.',
            action: 'cancelar exclusão',
            result: 'exclusão cancelada',
            pendingAction: null,
          }),
        );
      }

      await prisma.monthEntry.delete({
        where: { id: pendingAction.entryId },
      });

      return res.json(
        buildBaseResponse({
          intention: 'delete_entry',
          message: `Lançamento removido com sucesso: ${pendingAction.preview}.`,
          action: 'remover lançamento',
          result: 'sucesso',
          pendingAction: null,
        }),
      );
    }

    const intent = detectIntent(message);
    const detectedType = detectType(message);
    const amount = parseAmount(message);
    const date = parseDate(message);
    const dateIso = formatDateISO(date);

    if (intent === 'summary') {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const entries = await prisma.monthEntry.findMany({
        where: { year, month },
      });

      const totalIncome = entries.filter((entry) => entry.type === 'income').reduce((acc, cur) => acc + cur.amount, 0);
      const totalExpense = entries.filter((entry) => entry.type === 'expense').reduce((acc, cur) => acc + cur.amount, 0);
      const balance = totalIncome - totalExpense;

      return res.json(
        buildBaseResponse({
          intention: 'summary',
          message: `Resumo ${month}/${year}: ganhos R$ ${totalIncome.toFixed(2)}, gastos R$ ${totalExpense.toFixed(2)}, saldo R$ ${balance.toFixed(2)}.`,
          dataCaptured: { year, month },
          action: 'consultar resumo mensal',
          result: 'sucesso',
        }),
      );
    }

    if (intent === 'add_entry') {
      if (!detectedType || !amount) {
        const pendencias: string[] = [];
        if (!detectedType) pendencias.push('Informe se é gasto (despesa) ou ganho (receita).');
        if (!amount) pendencias.push('Informe o valor da movimentação.');

        return res.json(
          buildBaseResponse({
            intention: 'add_entry',
            message: 'Preciso de alguns dados para cadastrar.',
            dataCaptured: {
              type: detectedType,
              amount,
              date: dateIso,
            },
            pendencias,
            action: 'solicitar dados faltantes',
            result: 'pendente',
          }),
        );
      }

      const description = extractDescription(message) ?? (detectedType === 'expense' ? 'Gasto avulso' : 'Ganho avulso');
      const category = parseCategory(message, detectedType);

      const entry = await prisma.monthEntry.create({
        data: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          type: detectedType,
          description,
          amount,
          date: dateIso,
          category,
          paymentMethod: detectedType === 'expense' ? 'Não especificado' : null,
          isFixed: false,
        },
      });

      const kindLabel = detectedType === 'expense' ? 'gasto' : 'ganho';
      return res.json(
        buildBaseResponse({
          intention: 'add_entry',
          message: `Registrado ${kindLabel} de R$ ${entry.amount.toFixed(2)} em ${entry.date}, categoria ${entry.category}.`,
          dataCaptured: {
            type: entry.type,
            amount: entry.amount,
            category: entry.category,
            date: entry.date,
            description: entry.description,
          },
          action: 'criar lançamento mensal',
          result: 'sucesso',
        }),
      );
    }

    if (intent === 'delete_entry') {
      const matches = await findCandidateEntries(message, detectedType);
      if (matches.length === 0) {
        return res.json(
          buildBaseResponse({
            intention: 'delete_entry',
            message: 'Não encontrei um lançamento compatível para remover.',
            dataCaptured: { type: detectedType, amount, description: extractDescription(message) },
            action: 'buscar lançamento',
            result: 'nenhum item encontrado',
          }),
        );
      }

      if (matches.length > 1) {
        return res.json(
          buildBaseResponse({
            intention: 'delete_entry',
            message: 'Encontrei mais de um lançamento. Me diga qual ID devo remover.',
            dataCaptured: { type: detectedType, amount, description: extractDescription(message) },
            action: 'solicitar desambiguação',
            result: 'ambíguo',
            options: matches.map((entry) => ({
              id: entry.id,
              label: `#${entry.id} ${entry.description} - R$ ${entry.amount.toFixed(2)} (${entry.date})`,
            })),
          }),
        );
      }

      const target = matches[0];
      return res.json(
        buildBaseResponse({
          intention: 'delete_entry',
          message: `Confirma remover #${target.id} (${target.description} - R$ ${target.amount.toFixed(2)} em ${target.date})? Responda "sim" para confirmar.`,
          dataCaptured: { id: target.id, description: target.description, amount: target.amount, date: target.date },
          action: 'solicitar confirmação de exclusão',
          result: 'aguardando confirmação',
          needsConfirmation: true,
          pendingAction: {
            action: 'delete_entry',
            entryId: target.id,
            preview: `${target.description} - R$ ${target.amount.toFixed(2)} (${target.date})`,
          },
        }),
      );
    }

    if (intent === 'update_entry') {
      const matches = await findCandidateEntries(message, detectedType);
      if (matches.length === 0) {
        return res.json(
          buildBaseResponse({
            intention: 'update_entry',
            message: 'Não encontrei lançamento para editar com os dados informados.',
            action: 'buscar lançamento',
            result: 'nenhum item encontrado',
          }),
        );
      }

      const newAmountMatch = normalizeText(message).match(/\bpara\s+(\d+(?:[.,]\d{1,2})?)\b/);
      const newAmount = newAmountMatch ? Number.parseFloat(newAmountMatch[1].replace(',', '.')) : null;
      if (!newAmount) {
        return res.json(
          buildBaseResponse({
            intention: 'update_entry',
            message: 'Encontrei o lançamento, mas preciso do novo valor. Ex.: "corrige para 32,90".',
            action: 'solicitar novo valor',
            result: 'pendente',
            options: matches.map((entry) => ({
              id: entry.id,
              label: `#${entry.id} ${entry.description} - R$ ${entry.amount.toFixed(2)} (${entry.date})`,
            })),
          }),
        );
      }

      const target = matches[0];
      const updated = await prisma.monthEntry.update({
        where: { id: target.id },
        data: { amount: newAmount },
      });

      return res.json(
        buildBaseResponse({
          intention: 'update_entry',
          message: `Lançamento #${updated.id} atualizado para R$ ${updated.amount.toFixed(2)} com sucesso.`,
          dataCaptured: { id: updated.id, amount: updated.amount },
          action: 'editar lançamento',
          result: 'sucesso',
        }),
      );
    }

    return res.json(
      buildBaseResponse({
        intention: 'unknown',
        message: 'Consigo ajudar com: adicionar, remover, editar lançamentos e resumir saldo.',
        action: 'orientar usuário',
        result: 'sem execução',
      }),
    );
  } catch (error) {
    console.error('Erro no agente:', error);
    return res.status(500).json(
      buildBaseResponse({
        message: 'Não consegui concluir essa solicitação agora. Tente novamente em instantes.',
        result: 'erro interno',
      }),
    );
  }
});

export default router;
