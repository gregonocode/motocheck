"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckBadge,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlinePrinter,
} from "react-icons/hi2";

type VisitaData = {
  id: string;
  moto_id: string | null;
  cliente_id: string | null;
  status: string | null;
  km: number | null;
  nivel_combustivel: string | null;
  foto_entrada_url: string | null;
  observacoes_entrada: string | null;
  foto_saida_url: string | null;
  observacoes_saida: string | null;
  assinatura_cliente_url: string | null;
  data_entrada: string | null;
  data_saida: string | null;
  tempo_permanencia_min: number | null;
  created_at: string | null;
};

type MotoData = {
  id: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cilindrada: string | null;
  ano: number | null;
  cor: string | null;
};

type ClienteData = {
  id: string;
  nome: string | null;
  telefone: string | null;
};

type ChecklistItem = {
  id: string;
  visita_id: string;
  categoria_id: string | null;
  item_modelo_id: string | null;
  status: string | null;
  observacao: string | null;
  tipo_checklist: string | null;
  valor_texto: string | null;
  ordem: number | null;
};

const questionLabels: Record<string, string> = {
  "a1111111-1111-1111-1111-111111111111": "Nível de combustível",
  "b1111111-1111-1111-1111-111111111111": "Pisca esquerdo",
  "b2222222-2222-2222-2222-222222222222": "Pisca direito",
  "b3333333-3333-3333-3333-333333333333": "Farol",
  "b4444444-4444-4444-4444-444444444444": "Buzina",
  "c2222222-2222-2222-2222-222222222222": "Caximbo de vela",
  "f1111111-1111-1111-1111-111111111111": "Observações da entrada",
  "f2222222-2222-2222-2222-222222222222": "Foto da entrada",
};

const valueLabels: Record<string, string> = {
  baixo: "Baixo",
  medio: "Médio",
  cheio: "Cheio",
  ok: "OK",
  atencao: "Atenção",
  nao_funciona: "Não funciona",
  trocar: "Trocar",
  foto_ok: "Foto adicionada",
  foto_depois: "Adicionar depois",
};

const requiredChecklistItemIds = [
  "a1111111-1111-1111-1111-111111111111", // combustível
  "b1111111-1111-1111-1111-111111111111", // pisca esquerdo
  "b2222222-2222-2222-2222-222222222222", // pisca direito
  "b3333333-3333-3333-3333-333333333333", // farol
  "b4444444-4444-4444-4444-444444444444", // buzina
  "c2222222-2222-2222-2222-222222222222", // caximbo de vela
  "f1111111-1111-1111-1111-111111111111", // observações
  "f2222222-2222-2222-2222-222222222222", // foto ou adicionar depois
];

function formatStatus(status?: string | null) {
  if (status === "aberta" || status === "em_andamento") return "Em andamento";
  if (status === "aguardando") return "Aguardando";
  if (status === "finalizada") return "Finalizada";
  if (status === "cancelada") return "Cancelada";
  return "Sem status";
}

function getStatusClasses(status?: string | null) {
  if (status === "finalizada") return "bg-green-100 text-green-700";
  if (status === "aguardando") return "bg-blue-100 text-blue-700";
  if (status === "aberta" || status === "em_andamento") {
    return "bg-yellow-100 text-yellow-700";
  }
  if (status === "cancelada") return "bg-red-100 text-red-700";
  return "bg-zinc-100 text-zinc-700";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTempo(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "—";

  const horas = Math.floor(minutes / 60);
  const minutos = minutes % 60;

  if (horas <= 0) return `${minutos}min`;

  return `${horas}h ${minutos}min`;
}

function formatAnswer(item: ChecklistItem) {
  const value = item.valor_texto || item.status || "—";
  return valueLabels[value] ?? value;
}

function getQuestionTitle(item: ChecklistItem) {
  if (item.item_modelo_id && questionLabels[item.item_modelo_id]) {
    return questionLabels[item.item_modelo_id];
  }

  return "Item do checklist";
}

export default function EntradaSaidaDetalhePage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);

  const visitaId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [visita, setVisita] = useState<VisitaData | null>(null);
  const [moto, setMoto] = useState<MotoData | null>(null);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showPdfBlockedModal, setShowPdfBlockedModal] = useState(false);

  async function loadData() {
    try {
      setLoading(true);

      const { data: visitaData, error: visitaError } = await supabase
        .from("visitas")
        .select(
          "id, moto_id, cliente_id, status, km, nivel_combustivel, foto_entrada_url, observacoes_entrada, foto_saida_url, observacoes_saida, assinatura_cliente_url, data_entrada, data_saida, tempo_permanencia_min, created_at"
        )
        .eq("id", visitaId)
        .maybeSingle();

      if (visitaError) throw visitaError;

      if (!visitaData) {
        setVisita(null);
        return;
      }

      setVisita(visitaData as VisitaData);

      if (visitaData.moto_id) {
        const { data: motoData, error: motoError } = await supabase
          .from("motos")
          .select("id, placa, marca, modelo, cilindrada, ano, cor")
          .eq("id", visitaData.moto_id)
          .maybeSingle();

        if (motoError) throw motoError;

        setMoto((motoData ?? null) as MotoData | null);
      }

      if (visitaData.cliente_id) {
        const { data: clienteData, error: clienteError } = await supabase
          .from("clientes")
          .select("id, nome, telefone")
          .eq("id", visitaData.cliente_id)
          .maybeSingle();

        if (clienteError) throw clienteError;

        setCliente((clienteData ?? null) as ClienteData | null);
      }

      const { data: checklistData, error: checklistError } = await supabase
        .from("visita_checklist_itens")
        .select(
          "id, visita_id, categoria_id, item_modelo_id, status, observacao, tipo_checklist, valor_texto, ordem"
        )
        .eq("visita_id", visitaId)
        .eq("tipo_checklist", "entrada")
        .order("ordem", { ascending: true });

      if (checklistError) throw checklistError;

      setChecklist((checklistData ?? []) as ChecklistItem[]);
    } catch (error) {
      console.error("Erro ao carregar detalhe da visita:", error);
      alert("Não foi possível carregar os dados da visita.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visitaId) {
      void Promise.resolve().then(() => loadData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitaId]);

  async function handleFinalizarAtendimento() {
    if (!visita) return;

    try {
      setFinalizing(true);

      const { error } = await supabase
        .from("visitas")
        .update({
          status: "finalizada",
          data_saida: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", visita.id);

      if (error) throw error;

      setShowFinalizarModal(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao finalizar atendimento:", error);
      alert("Não foi possível finalizar o atendimento.");
    } finally {
      setFinalizing(false);
    }
  }

  async function handleGerarPdf() {
    if (!visita) return;

    const statusEmAndamento =
      visita.status === "aberta" || visita.status === "em_andamento";

    const checklistCompleto = requiredChecklistItemIds.every((itemId) =>
      checklist.some((item) => {
        const value = item.valor_texto || item.status;
        return item.item_modelo_id === itemId && !!value;
      })
    );

    if (statusEmAndamento || !checklistCompleto) {
      setShowPdfBlockedModal(true);
      return;
    }

    try {
      setGeneratingPdf(true);

      // Próximo passo: vamos criar esse endpoint.
      window.open(`/api/visitas/${visita.id}/pdf`, "_blank");
    } catch (error) {
      console.error("Erro ao abrir PDF:", error);
      alert("Não foi possível abrir o PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-lg font-black text-[#181818]">
            Carregando detalhes da visita...
          </p>
        </div>
      </div>
    );
  }

  if (!visita) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-lg font-black text-[#181818]">
            Visita não encontrada.
          </p>

          <Link
            href="/dashboard/entradas-saidas"
            className="mt-5 inline-flex rounded-2xl bg-[#181818] px-5 py-3 text-sm font-black text-white"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const canFinalize =
    visita.status !== "finalizada" && visita.status !== "cancelada";

  const statusEmAndamento =
    visita.status === "aberta" || visita.status === "em_andamento";

  const checklistCompleto = requiredChecklistItemIds.every((itemId) =>
    checklist.some((item) => {
      const value = item.valor_texto || item.status;
      return item.item_modelo_id === itemId && !!value;
    })
  );

  const podeGerarPdf = !statusEmAndamento && checklistCompleto;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/dashboard/entradas-saidas"
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
          >
            <HiOutlineArrowLeft size={18} />
            Voltar para entradas e saídas
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
              Detalhe da visita
            </p>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                visita.status
              )}`}
            >
              {formatStatus(visita.status)}
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            {moto?.placa ?? "Moto sem placa"}
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-medium text-zinc-600 sm:text-base">
            Visualize as informações da entrada, respostas do checklist e deixe
            pronto para gerar o PDF de assinatura.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {canFinalize ? (
            <button
              type="button"
              onClick={() => setShowFinalizarModal(true)}
              disabled={finalizing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-4 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlineCheckCircle size={19} />
              {finalizing ? "Finalizando..." : "Finalizar atendimento"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleGerarPdf}
            disabled={generatingPdf}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              podeGerarPdf
                ? "bg-yellow-200 text-[#181818] hover:opacity-95"
                : "bg-zinc-200 text-zinc-500"
            }`}
          >
            <HiOutlineDocumentText size={19} />
            {generatingPdf ? "Gerando..." : "Gerar PDF"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <HiOutlineCheckBadge size={22} />
          </div>

          <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
            Moto
          </p>

          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Placa:</span> {moto?.placa ?? "—"}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Modelo:</span>{" "}
              {[moto?.marca, moto?.modelo].filter(Boolean).join(" ") || "—"}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Cilindrada:</span>{" "}
              {moto?.cilindrada ?? "—"}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Ano/Cor:</span>{" "}
              {[moto?.ano, moto?.cor].filter(Boolean).join(" • ") || "—"}
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
            Cliente
          </p>

          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Nome:</span> {cliente?.nome ?? "—"}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Telefone:</span>{" "}
              {cliente?.telefone ?? "—"}
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
            Atendimento
          </p>

          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Entrada:</span>{" "}
              {formatDateTime(visita.data_entrada)}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Saída:</span>{" "}
              {formatDateTime(visita.data_saida)}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Permanência:</span>{" "}
              {formatTempo(visita.tempo_permanencia_min)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#181818]">
              Checklist de entrada
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Respostas registradas durante a entrada da moto.
            </p>
          </div>

          <Link
            href={`/dashboard/atendimentos/${visita.id}/quiz`}
            className="rounded-2xl bg-yellow-200 px-4 py-3 text-center text-sm font-black text-[#181818] transition hover:opacity-90"
          >
            Editar checklist
          </Link>
        </div>

        {checklist.length === 0 ? (
          <div className="rounded-3xl bg-zinc-50 p-6 text-center">
            <p className="text-sm font-bold text-zinc-500">
              Nenhuma resposta de checklist foi registrada ainda.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-zinc-200 bg-[#FAFAFA] p-4"
              >
                <p className="text-sm font-black text-[#181818]">
                  {getQuestionTitle(item)}
                </p>

                <p className="mt-2 text-lg font-black text-[#181818]">
                  {formatAnswer(item)}
                </p>

                {item.observacao ? (
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500">
                    {item.observacao}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Próxima etapa
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#181818]">
              PDF e assinatura
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-zinc-500">
              O PDF será gerado como um Termo de Recebimento e Condições do Veículo,
              contendo os dados da moto, cliente, respostas do checklist, foto da entrada
              quando existir e espaço para assinatura do cliente.
            </p>

            <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
              <p className="text-sm font-black text-[#181818]">
                Status para PDF:
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-500">
                {podeGerarPdf
                  ? "Pronto para gerar PDF."
                  : statusEmAndamento
                  ? "Finalize o checklist antes de gerar o PDF."
                  : "Checklist incompleto. Responda todos os itens antes de gerar o PDF."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGerarPdf}
            disabled={generatingPdf}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              podeGerarPdf
                ? "border-zinc-300 text-[#181818] hover:bg-zinc-50"
                : "border-zinc-200 bg-zinc-100 text-zinc-500"
            }`}
          >
            <HiOutlinePrinter size={19} />
            {generatingPdf ? "Gerando..." : "Preparar PDF"}
          </button>
        </div>
      </div>

      {showFinalizarModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                Finalizar atendimento
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#181818]">
                Deseja finalizar este atendimento?
              </h2>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-sm font-black text-[#181818]">
                Placa: {moto?.placa ?? "—"}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Cliente: {cliente?.nome ?? "Cliente não informado"}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Moto:{" "}
                {[moto?.marca, moto?.modelo].filter(Boolean).join(" ") ||
                  "Moto não informada"}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={finalizing}
                onClick={() => setShowFinalizarModal(false)}
                className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={finalizing}
                onClick={handleFinalizarAtendimento}
                className="rounded-2xl bg-[#181818] px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finalizing ? "Finalizando..." : "Sim, finalizar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPdfBlockedModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                PDF indisponível
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#181818]">
                Ainda não é possível gerar o PDF
              </h2>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-500">
                O termo só pode ser gerado depois que o checklist de entrada estiver
                completo e o atendimento não estiver mais em andamento.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-sm font-black text-[#181818]">
                Situação atual:
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Status: {formatStatus(visita.status)}
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Checklist: {checklistCompleto ? "Completo" : "Incompleto"}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {!checklistCompleto ? (
                <Link
                  href={`/dashboard/atendimentos/${visita.id}/quiz`}
                  className="rounded-2xl bg-yellow-200 px-4 py-3 text-center text-sm font-black text-[#181818] transition hover:opacity-90"
                >
                  Continuar checklist
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setShowPdfBlockedModal(false)}
                className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
