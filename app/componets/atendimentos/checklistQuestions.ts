//app\componets\atendimentos\checklistQuestions.ts
export type ChecklistQuestionOption = {
  label: string;
  value: string;
};

export type ChecklistQuestionItem = {
  id: string;
  categoriaId: string;
  title: string;
  description?: string;
  type: "options" | "textarea";
  options?: ChecklistQuestionOption[];
  placeholder?: string;
};

export type ChecklistCategoriaRow = {
  id: string;
  nome: string | null;
  ordem: number | null;
  ativo: boolean | null;
};

export type ChecklistItemModeloRow = {
  id: string;
  categoria_id: string | null;
  nome: string | null;
  descricao: string | null;
  ordem: number | null;
  ativo: boolean | null;
};

export const PHOTO_QUESTION_ID = "f2222222-2222-2222-2222-222222222222";
export const OBSERVATION_QUESTION_ID = "f1111111-1111-1111-1111-111111111111";
export const FUEL_CATEGORY_ID = "11111111-1111-1111-1111-111111111111";

const fuelOptions: ChecklistQuestionOption[] = [
  { label: "Baixo", value: "baixo" },
  { label: "Médio", value: "medio" },
  { label: "Cheio", value: "cheio" },
];

const functionOptions: ChecklistQuestionOption[] = [
  { label: "OK", value: "ok" },
  { label: "Atenção", value: "atencao" },
  { label: "Não funciona", value: "nao_funciona" },
  { label: "Trocar", value: "trocar" },
];

const conditionOptions: ChecklistQuestionOption[] = [
  { label: "OK", value: "ok" },
  { label: "Atenção", value: "atencao" },
  { label: "Trocar", value: "trocar" },
];

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getQuestionOptions(
  item: ChecklistItemModeloRow,
  category?: ChecklistCategoriaRow
) {
  const itemName = normalizeText(item.nome);
  const categoryName = normalizeText(category?.nome);

  if (item.categoria_id === FUEL_CATEGORY_ID || categoryName === "combustivel") {
    return fuelOptions;
  }

  if (categoryName === "estrutura" || itemName.includes("pneu")) {
    return conditionOptions;
  }

  return functionOptions;
}

function getQuestionType(item: ChecklistItemModeloRow) {
  const name = normalizeText(item.nome);

  if (item.id === OBSERVATION_QUESTION_ID || name.includes("observ")) {
    return "textarea";
  }

  return "options";
}

function getQuestionPlaceholder(item: ChecklistItemModeloRow) {
  const name = normalizeText(item.nome);

  if (item.id === OBSERVATION_QUESTION_ID || name.includes("observ")) {
    return "Ex: carenagem arranhada no lado esquerdo, retrovisor solto, banco com pequeno rasgo...";
  }

  return undefined;
}

export function mapChecklistModelsToQuestions(
  items: ChecklistItemModeloRow[],
  categories: ChecklistCategoriaRow[]
): ChecklistQuestionItem[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return items
    .filter((item) => item.ativo !== false && item.categoria_id)
    .sort((a, b) => {
      if (a.id === PHOTO_QUESTION_ID) return 1;
      if (b.id === PHOTO_QUESTION_ID) return -1;

      const categoryA = a.categoria_id ? categoryMap.get(a.categoria_id) : null;
      const categoryB = b.categoria_id ? categoryMap.get(b.categoria_id) : null;
      const categoryOrderA = categoryA?.ordem ?? Number.MAX_SAFE_INTEGER;
      const categoryOrderB = categoryB?.ordem ?? Number.MAX_SAFE_INTEGER;

      if (categoryOrderA !== categoryOrderB) {
        return categoryOrderA - categoryOrderB;
      }

      return (a.ordem ?? 0) - (b.ordem ?? 0);
    })
    .map((item) => {
      const category = item.categoria_id ? categoryMap.get(item.categoria_id) : undefined;
      const type = getQuestionType(item);

      return {
        id: item.id,
        categoriaId: item.categoria_id ?? "",
        title: item.nome ?? "Item do checklist",
        description: item.descricao ?? undefined,
        type,
        options: type === "options" ? getQuestionOptions(item, category) : undefined,
        placeholder: getQuestionPlaceholder(item),
      };
    });
}

export const checklistEntradaQuestions: ChecklistQuestionItem[] = [];
