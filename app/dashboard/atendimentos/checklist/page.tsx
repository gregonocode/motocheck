"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardList,
  GripVertical,
  Layers3,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ChecklistCategoria = {
  id: string;
  nome: string | null;
  ordem: number | null;
  ativo: boolean | null;
};

type ChecklistItemModelo = {
  id: string;
  categoria_id: string | null;
  nome: string | null;
  descricao: string | null;
  ordem: number | null;
  ativo: boolean | null;
  created_at: string | null;
};

type ItemFormState = {
  nome: string;
  descricao: string;
  categoriaId: string;
};

type EtapaFormState = {
  nome: string;
};

const emptyItemForm: ItemFormState = {
  nome: "",
  descricao: "",
  categoriaId: "",
};

const emptyEtapaForm: EtapaFormState = {
  nome: "",
};

const PHOTO_QUESTION_ID = "f2222222-2222-2222-2222-222222222222";
const PHOTO_CATEGORY_ID = "77777777-7777-7777-7777-777777777777";

const fallbackCategoryNames: Record<string, string> = {
  "11111111-1111-1111-1111-111111111111": "Combustível",
  "22222222-2222-2222-2222-222222222222": "Elétrica",
  "33333333-3333-3333-3333-333333333333": "Motor",
  "44444444-4444-4444-4444-444444444444": "Freios",
  "55555555-5555-5555-5555-555555555555": "Estrutura",
  "66666666-6666-6666-6666-666666666666": "Observações",
  "77777777-7777-7777-7777-777777777777": "Comprovação",
};

function sortByOrder<T extends { ordem: number | null }>(list: T[]) {
  return [...list].sort(
    (a, b) =>
      (a.ordem ?? Number.MAX_SAFE_INTEGER) -
      (b.ordem ?? Number.MAX_SAFE_INTEGER)
  );
}

export default function ChecklistConfigPage() {
  const supabase = useMemo(() => createClient(), []);

  const [categories, setCategories] = useState<ChecklistCategoria[]>([]);
  const [items, setItems] = useState<ChecklistItemModelo[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showInactive, setShowInactive] = useState(false);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [etapaModalOpen, setEtapaModalOpen] = useState(false);

  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [etapaForm, setEtapaForm] = useState<EtapaFormState>(emptyEtapaForm);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] =
    useState<ItemFormState>(emptyItemForm);

  const [removeTarget, setRemoveTarget] =
    useState<ChecklistItemModelo | null>(null);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(
    null
  );

  const activeItems = useMemo(
    () =>
      items.filter(
        (item) => item.ativo !== false && item.id !== PHOTO_QUESTION_ID
      ),
    [items]
  );

  const activeCategories = useMemo(() => {
    const activeDbCategories = categories.filter(
      (category) =>
        category.ativo !== false && category.id !== PHOTO_CATEGORY_ID
    );

    const existingIds = new Set(
      activeDbCategories.map((category) => category.id)
    );

    const missingCategoriesFromItems = activeItems
      .map((item) => item.categoria_id)
      .filter((categoriaId): categoriaId is string => Boolean(categoriaId))
      .filter((categoriaId, index, array) => {
        return (
          !existingIds.has(categoriaId) &&
          categoriaId !== PHOTO_CATEGORY_ID &&
          array.indexOf(categoriaId) === index
        );
      })
      .map((categoriaId, index) => ({
        id: categoriaId,
        nome: fallbackCategoryNames[categoriaId] ?? "Categoria sem cadastro",
        ordem: 900 + index,
        ativo: true,
      }));

    return sortByOrder([...activeDbCategories, ...missingCategoriesFromItems]);
  }, [categories, activeItems]);

  const inactiveItems = useMemo(
    () =>
      sortByOrder(
        items.filter(
          (item) => item.ativo === false && item.id !== PHOTO_QUESTION_ID
        )
      ),
    [items]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, ChecklistItemModelo[]>();

    activeCategories.forEach((category) => {
      map.set(category.id, []);
    });

    activeItems.forEach((item) => {
      if (!item.categoria_id) return;

      const current = map.get(item.categoria_id) ?? [];
      current.push(item);
      map.set(item.categoria_id, current);
    });

    map.forEach((categoryItems, categoryId) => {
      map.set(categoryId, sortByOrder(categoryItems));
    });

    return map;
  }, [activeCategories, activeItems]);

  async function loadChecklistData() {
    try {
      setLoading(true);

      const [
        { data: categoryData, error: categoryError },
        { data: itemData, error: itemError },
      ] = await Promise.all([
        supabase
          .from("checklist_categorias")
          .select("id, nome, ordem, ativo")
          .or("ativo.is.true,ativo.is.null")
          .order("ordem", { ascending: true }),

        supabase
          .from("checklist_itens_modelo")
          .select("id, categoria_id, nome, descricao, ordem, ativo, created_at")
          .or("ativo.is.true,ativo.is.null")
          .order("ordem", { ascending: true }),
      ]);

      if (categoryError) throw categoryError;
      if (itemError) throw itemError;

      const nextCategories = (categoryData ?? []) as ChecklistCategoria[];
      const nextItems = (itemData ?? []) as ChecklistItemModelo[];

      setCategories(nextCategories);
      setItems(nextItems);

      console.log("Categorias carregadas:", nextCategories);
      console.log("Itens carregados:", nextItems);

      const firstActiveCategory = nextCategories.find(
        (category) =>
          category.ativo !== false && category.id !== PHOTO_CATEGORY_ID
      );

      setItemForm((prev) => ({
        ...prev,
        categoriaId: prev.categoriaId || firstActiveCategory?.id || "",
      }));
    } catch (error) {
      console.error("Erro ao carregar checklist:", error);
      toast.error("Não foi possível carregar o checklist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadChecklistData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNewItemModal(categoryId?: string) {
    setItemForm({
      ...emptyItemForm,
      categoriaId: categoryId || activeCategories[0]?.id || "",
    });
    setItemModalOpen(true);
  }

  function closeNewItemModal() {
    setItemModalOpen(false);
    setItemForm(emptyItemForm);
  }

  function openEtapaModal() {
    setEtapaForm(emptyEtapaForm);
    setEtapaModalOpen(true);
  }

  function closeEtapaModal() {
    setEtapaModalOpen(false);
    setEtapaForm(emptyEtapaForm);
  }

  function startEditing(item: ChecklistItemModelo) {
    setEditingItemId(item.id);
    setEditItemForm({
      nome: item.nome ?? "",
      descricao: item.descricao ?? "",
      categoriaId: item.categoria_id ?? activeCategories[0]?.id ?? "",
    });
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditItemForm(emptyItemForm);
  }

  async function handleCreateEtapa() {
    const nome = etapaForm.nome.trim();

    if (!nome) {
      toast.error("Informe o nome da etapa.");
      return;
    }

    try {
      setSaving(true);

      const nextOrder = activeCategories.length + 1;

      const { error } = await supabase.from("checklist_categorias").insert({
        id: crypto.randomUUID(),
        nome,
        ordem: nextOrder,
        ativo: true,
      });

      if (error) throw error;

      toast.success("Etapa adicionada.");
      closeEtapaModal();
      await loadChecklistData();
    } catch (error) {
      console.error("Erro ao criar etapa:", error);
      toast.error("Não foi possível criar a etapa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateItem() {
    const nome = itemForm.nome.trim();
    const descricao = itemForm.descricao.trim();
    const categoriaId = itemForm.categoriaId;

    if (!nome) {
      toast.error("Informe o nome do checklist.");
      return;
    }

    if (!categoriaId) {
      toast.error("Selecione uma etapa.");
      return;
    }

    try {
      setSaving(true);

      const categoryItems = itemsByCategory.get(categoriaId) ?? [];
      const nextOrder = categoryItems.length + 1;

      const { error } = await supabase.from("checklist_itens_modelo").insert({
        id: crypto.randomUUID(),
        categoria_id: categoriaId,
        nome,
        descricao: descricao || null,
        ordem: nextOrder,
        ativo: true,
      });

      if (error) throw error;

      toast.success("Checklist adicionado.");
      closeNewItemModal();
      await loadChecklistData();
    } catch (error) {
      console.error("Erro ao criar checklist:", error);
      toast.error("Não foi possível criar o checklist.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(itemId: string) {
    const nome = editItemForm.nome.trim();
    const descricao = editItemForm.descricao.trim();

    if (!nome) {
      toast.error("Informe o nome do checklist.");
      return;
    }

    if (!editItemForm.categoriaId) {
      toast.error("Selecione uma etapa.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("checklist_itens_modelo")
        .update({
          nome,
          descricao: descricao || null,
          categoria_id: editItemForm.categoriaId,
        })
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Checklist atualizado.");
      cancelEditing();
      await loadChecklistData();
    } catch (error) {
      console.error("Erro ao editar checklist:", error);
      toast.error("Não foi possível editar o checklist.");
    } finally {
      setSaving(false);
    }
  }

  async function setItemActive(itemId: string, ativo: boolean) {
    if (itemId === PHOTO_QUESTION_ID) {
      toast.error("A foto da entrada é fixa no final do checklist.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("checklist_itens_modelo")
        .update({ ativo })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(ativo ? "Checklist reativado." : "Checklist removido.");
      setRemoveTarget(null);

      if (editingItemId === itemId) {
        cancelEditing();
      }

      await loadChecklistData();
    } catch (error) {
      console.error("Erro ao alterar checklist:", error);
      toast.error("Não foi possível alterar o checklist.");
    } finally {
      setSaving(false);
    }
  }

  async function persistItemOrder(categoryId: string, categoryItems: ChecklistItemModelo[]) {
    const updates = categoryItems.map((item, index) =>
      supabase
        .from("checklist_itens_modelo")
        .update({
          categoria_id: categoryId,
          ordem: index + 1,
        })
        .eq("id", item.id)
    );

    const results = await Promise.all(updates);
    const error = results.find((result) => result.error)?.error;

    if (error) throw error;
  }

  async function handleDropItem(targetCategoryId: string, targetItemId?: string) {
    if (!draggingItemId) return;

    const draggedItem = items.find((item) => item.id === draggingItemId);

    if (!draggedItem) {
      setDraggingItemId(null);
      return;
    }

    try {
      setSaving(true);

      const currentCategoryId = draggedItem.categoria_id;
      const targetCategoryItems = sortByOrder(
        activeItems.filter(
          (item) =>
            item.categoria_id === targetCategoryId &&
            item.id !== draggingItemId
        )
      );

      let nextTargetItems: ChecklistItemModelo[];

      if (targetItemId) {
        const targetIndex = targetCategoryItems.findIndex(
          (item) => item.id === targetItemId
        );

        nextTargetItems = [...targetCategoryItems];
        nextTargetItems.splice(Math.max(targetIndex, 0), 0, {
          ...draggedItem,
          categoria_id: targetCategoryId,
        });
      } else {
        nextTargetItems = [
          ...targetCategoryItems,
          {
            ...draggedItem,
            categoria_id: targetCategoryId,
          },
        ];
      }

      await persistItemOrder(targetCategoryId, nextTargetItems);

      if (currentCategoryId && currentCategoryId !== targetCategoryId) {
        const oldCategoryItems = sortByOrder(
          activeItems.filter(
            (item) =>
              item.categoria_id === currentCategoryId &&
              item.id !== draggingItemId
          )
        );

        await persistItemOrder(currentCategoryId, oldCategoryItems);
      }

      toast.success("Ordem atualizada.");
      await loadChecklistData();
    } catch (error) {
      console.error("Erro ao reordenar checklist:", error);
      toast.error("Não foi possível atualizar a ordem.");
    } finally {
      setSaving(false);
      setDraggingItemId(null);
    }
  }

  async function handleDropCategory(targetCategoryId: string) {
    if (!draggingCategoryId || draggingCategoryId === targetCategoryId) {
      setDraggingCategoryId(null);
      return;
    }

    try {
      setSaving(true);

      const current = activeCategories;
      const fromIndex = current.findIndex(
        (category) => category.id === draggingCategoryId
      );
      const toIndex = current.findIndex(
        (category) => category.id === targetCategoryId
      );

      if (fromIndex < 0 || toIndex < 0) return;

      const nextCategories = [...current];
      const [moved] = nextCategories.splice(fromIndex, 1);
      nextCategories.splice(toIndex, 0, moved);

      const updates = nextCategories.map((category, index) =>
        supabase
          .from("checklist_categorias")
          .update({ ordem: index + 1 })
          .eq("id", category.id)
      );

      const results = await Promise.all(updates);
      const error = results.find((result) => result.error)?.error;

      if (error) throw error;

      toast.success("Etapas reorganizadas.");
      await loadChecklistData();
    } catch (error) {
      console.error("Erro ao reordenar etapas:", error);
      toast.error("Não foi possível reorganizar as etapas.");
    } finally {
      setSaving(false);
      setDraggingCategoryId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/dashboard/atendimentos"
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
          >
            <ArrowLeft size={18} />
            Voltar para atendimentos
          </Link>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Configuração
          </p>

          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
            Checklist de entrada.
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-medium text-zinc-600 sm:text-base">
            Organize as etapas, arraste os checklists para mudar a ordem e
            remova itens sem perder respostas antigas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                <Layers3 size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-500">Etapas</p>
                <p className="text-3xl font-black text-[#181818]">
                  {activeCategories.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-[#181818]">
                <ClipboardList size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-500">Checklists</p>
                <p className="text-3xl font-black text-[#181818]">
                  {activeItems.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#181818]">
            Construtor do checklist
          </h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">
            Arraste as etapas ou os itens para reorganizar.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openEtapaModal}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} />
            Adicionar etapa
          </button>

          <button
            type="button"
            onClick={() => openNewItemModal()}
            disabled={saving || loading || !activeCategories.length}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} />
            Adicionar checklist
          </button>
        </div>
      </div>

      <div className="rounded-[32px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        {loading ? (
          <div className="rounded-3xl bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-500">
            Carregando checklist...
          </div>
        ) : activeCategories.length ? (
          <div className="space-y-4">
            {activeCategories.map((category, categoryIndex) => {
              const categoryItems = itemsByCategory.get(category.id) ?? [];

              return (
                <div
                  key={category.id}
                  draggable={!saving}
                  onDragStart={() => setDraggingCategoryId(category.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropCategory(category.id)}
                  className="rounded-[28px] border border-zinc-200 bg-[#FAFAFA] p-4"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 active:cursor-grabbing">
                        <GripVertical size={18} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-[#181818]">
                            Etapa {categoryIndex + 1}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-500">
                            {categoryItems.length} itens
                          </span>
                        </div>

                        <h3 className="mt-2 text-xl font-black text-[#181818]">
                          {category.nome ?? "Etapa sem nome"}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => openNewItemModal(category.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#181818] ring-1 ring-zinc-200 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus size={17} />
                      Adicionar item
                    </button>
                  </div>

                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropItem(category.id)}
                    className="space-y-3 rounded-3xl border border-dashed border-zinc-300 bg-white/70 p-3"
                  >
                    {categoryItems.length ? (
                      categoryItems.map((item, itemIndex) => {
                        const isEditing = editingItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            draggable={!saving && !isEditing}
                            onDragStart={() => setDraggingItemId(item.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.stopPropagation();
                              void handleDropItem(category.id, item.id);
                            }}
                            className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm"
                          >
                            {isEditing ? (
                              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_220px_auto] lg:items-end">
                                <label className="block">
                                  <span className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-500">
                                    Nome
                                  </span>
                                  <input
                                    value={editItemForm.nome}
                                    onChange={(event) =>
                                      setEditItemForm((prev) => ({
                                        ...prev,
                                        nome: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-yellow-300"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-500">
                                    Descrição
                                  </span>
                                  <input
                                    value={editItemForm.descricao}
                                    onChange={(event) =>
                                      setEditItemForm((prev) => ({
                                        ...prev,
                                        descricao: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-yellow-300"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-500">
                                    Etapa
                                  </span>
                                  <select
                                    value={editItemForm.categoriaId}
                                    onChange={(event) =>
                                      setEditItemForm((prev) => ({
                                        ...prev,
                                        categoriaId: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-yellow-300"
                                  >
                                    {activeCategories.map((categoryOption) => (
                                      <option
                                        key={categoryOption.id}
                                        value={categoryOption.id}
                                      >
                                        {categoryOption.nome ?? "Etapa"}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => handleSaveEdit(item.id)}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181818] text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Salvar"
                                  >
                                    <Save size={18} />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={cancelEditing}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Cancelar"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="mt-1 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-2xl border border-zinc-200 bg-[#FAFAFA] text-zinc-500 active:cursor-grabbing">
                                    <GripVertical size={17} />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                                        #{itemIndex + 1}
                                      </span>
                                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                                        Ativo
                                      </span>
                                    </div>

                                    <p className="mt-2 text-lg font-black text-[#181818]">
                                      {item.nome ?? "Checklist sem nome"}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-zinc-500">
                                      {item.descricao || "Sem descrição"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => startEditing(item)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Pencil size={17} />
                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setRemoveTarget(item)}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Remover checklist"
                                  >
                                    <Minus size={20} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-3xl bg-zinc-50 p-6 text-center">
                        <p className="text-sm font-black text-zinc-500">
                          Nenhum checklist nesta etapa.
                        </p>
                        <button
                          type="button"
                          onClick={() => openNewItemModal(category.id)}
                          className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-4 py-2 text-sm font-black text-white"
                        >
                          <Plus size={16} />
                          Adicionar primeiro item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-zinc-50 p-8 text-center">
            <p className="text-sm font-black text-zinc-500">
              Nenhuma etapa ativa cadastrada.
            </p>
            <button
              type="button"
              onClick={openEtapaModal}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-3 text-sm font-black text-white"
            >
              <Plus size={18} />
              Criar primeira etapa
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowInactive((prev) => !prev)}
            className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50"
          >
            {showInactive ? "Ocultar removidos" : "Ver removidos"}
          </button>

          <div className="rounded-3xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <Check size={18} />
              </div>
              <p className="text-sm font-semibold leading-relaxed text-green-800">
                Ao remover um checklist ele fica inativo, mas respostas antigas
                continuam preservadas.
              </p>
            </div>
          </div>
        </div>

        {showInactive ? (
          <div className="mt-6 border-t border-zinc-200 pt-5">
            <h3 className="text-lg font-black text-[#181818]">
              Checklists removidos
            </h3>

            {inactiveItems.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {inactiveItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-zinc-200 bg-white p-4"
                  >
                    <p className="text-sm font-black text-[#181818]">
                      {item.nome ?? "Checklist sem nome"}
                    </p>

                    <p className="mt-1 text-xs font-bold text-zinc-500">
                      {item.categoria_id
                        ? categoryMap.get(item.categoria_id)?.nome
                        : "Sem etapa"}
                    </p>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setItemActive(item.id, true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-green-100 px-4 py-2 text-sm font-black text-green-700 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      Reativar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-3xl bg-zinc-50 p-6 text-center text-sm font-bold text-zinc-500">
                Nenhum checklist removido.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {itemModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-[#181818]">
                  Adicionar checklist
                </h3>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  Crie um novo item para aparecer no quiz.
                </p>
              </div>

              <button
                type="button"
                onClick={closeNewItemModal}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 text-[#181818] transition hover:bg-zinc-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#181818]">
                  Nome
                </span>
                <input
                  value={itemForm.nome}
                  onChange={(event) =>
                    setItemForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  placeholder="Ex: Corrente"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-yellow-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#181818]">
                  Descrição
                </span>
                <input
                  value={itemForm.descricao}
                  onChange={(event) =>
                    setItemForm((prev) => ({
                      ...prev,
                      descricao: event.target.value,
                    }))
                  }
                  placeholder="Ex: Verificar folga e lubrificação"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-yellow-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#181818]">
                  Etapa
                </span>
                <select
                  value={itemForm.categoriaId}
                  onChange={(event) =>
                    setItemForm((prev) => ({
                      ...prev,
                      categoriaId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-yellow-300"
                >
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome ?? "Etapa"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeNewItemModal}
                disabled={saving}
                className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateItem}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {etapaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-[#181818]">
                  Adicionar etapa
                </h3>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  Exemplo: Pneus, Motor, Elétrica ou Fotos.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEtapaModal}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 text-[#181818] transition hover:bg-zinc-50"
              >
                <X size={20} />
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#181818]">
                Nome da etapa
              </span>
              <input
                value={etapaForm.nome}
                onChange={(event) =>
                  setEtapaForm({ nome: event.target.value })
                }
                placeholder="Ex: Motor"
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-yellow-300"
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEtapaModal}
                disabled={saving}
                className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateEtapa}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />
                Criar etapa
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {removeTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[32px] bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h3 className="text-xl font-black text-[#181818]">
                  Remover checklist?
                </h3>

                <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500">
                  O item{" "}
                  <strong className="text-[#181818]">
                    {removeTarget.nome ?? "sem nome"}
                  </strong>{" "}
                  será removido da lista ativa, mas os atendimentos antigos
                  continuarão preservados.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={saving}
                className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => setItemActive(removeTarget.id, false)}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
