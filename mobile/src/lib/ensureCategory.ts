export type CategoryLike = { name: string };

export type CategoriesApi = {
  categories: {
    create: (data: { name: string; type: 'income' | 'expense' }) => Promise<unknown>;
  };
};

function findExistingName(existing: CategoryLike[], trimmed: string): string | null {
  const key = trimmed.toLowerCase();
  const match = existing.find((c) => c.name.trim().toLowerCase() === key);
  return match ? match.name.trim() : null;
}

export async function ensureCategoryExists(
  api: CategoriesApi,
  name: string,
  type: 'income' | 'expense',
  existing: CategoryLike[]
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Selecione ou informe uma categoria');
  }

  const known = findExistingName(existing, trimmed);
  if (known) return known;

  try {
    await api.categories.create({ name: trimmed, type });
    return trimmed;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Não foi possível criar a categoria';
    if (message.includes('já existe')) {
      throw new Error('Categoria já existe');
    }
    throw err instanceof Error ? err : new Error(message);
  }
}
