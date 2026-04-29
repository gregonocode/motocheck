"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  HiOutlineArrowPath,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import { FaMotorcycle } from "react-icons/fa";

type PeriodFilter = "hoje" | "ontem" | "7dias" | "todas";
type StatusFilter = "todas" | "em_andamento" | "finalizadas";

type VisitaRow = {
  id: string;
  moto_id: string | null;
  cliente_id: string | null;
  atendente_id: string | null;
  status: string | null;
  data_entrada: string | null;
  data_saida: string | null;
  created_at: string | null;
};

type MotoRow = {
  id: string;
  placa: string | null;
  modelo: string | null;
  marca: string | null;
};

type ClienteRow = {
  id: string;
  nome: string | null;
  telefone: string | null;
};

type VisitaListItem = {
  id: string;
  placa: string;
  moto: string;
  cliente: string;
  telefone: string;
  status: string;
  dataEntrada: string;
  dataSaida: string;
  rawStatus: string;
};

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7dias", label: "7 dias" },
  { value: "todas", label: "Todas" },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizadas", label: "Finalizadas" },
];

const ITEMS_PER_PAGE = 15;

function getSaoPauloDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function saoPauloMidnightToUtc(year: number, month: number, day: number) {
  // America/Sao_Paulo/Brasília = UTC-03:00
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
}

function getPeriodRange(period: PeriodFilter) {
  if (period === "todas") {
    return null;
  }

  const { year, month, day } = getSaoPauloDateParts();
  const todayStart = saoPauloMidnightToUtc(year, month, day);

  if (period === "hoje") {
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    return {
      start: todayStart.toISOString(),
      end: tomorrowStart.toISOString(),
    };
  }

  if (period === "ontem") {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

    return {
      start: yesterdayStart.toISOString(),
      end: todayStart.toISOString(),
    };
  }

  const sevenDaysStart = new Date(todayStart);
  sevenDaysStart.setUTCDate(sevenDaysStart.getUTCDate() - 6);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  return {
    start: sevenDaysStart.toISOString(),
    end: tomorrowStart.toISOString(),
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status?: string | null) {
  if (status === "aberta" || status === "em_andamento") return "Em andamento";
  if (status === "aguardando") return "Aguardando";
  if (status === "finalizada") return "Finalizada";
  if (status === "cancelada") return "Cancelada";
  return "Sem atendimento";
}

function getStatusClasses(status: string) {
  if (status === "finalizada") {
    return "bg-green-100 text-green-700";
  }

  if (status === "aguardando") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "aberta" || status === "em_andamento") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (status === "cancelada") {
    return "bg-red-100 text-red-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function EntradasSaidasPage() {
  const supabase = useMemo(() => createClient(), []);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("hoje");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [visitas, setVisitas] = useState<VisitaListItem[]>([]);
  const [finalizingVisitaId, setFinalizingVisitaId] = useState<string | null>(
    null
  );
  const [confirmFinalizar, setConfirmFinalizar] =
    useState<VisitaListItem | null>(null);

  async function loadVisitas() {
    try {
      setLoading(true);

      const range = getPeriodRange(periodFilter);

      let query = supabase
        .from("visitas")
        .select(
          "id, moto_id, cliente_id, atendente_id, status, data_entrada, data_saida, created_at"
        )
        .order("data_entrada", { ascending: false });

      if (range) {
        query = query.gte("data_entrada", range.start).lt("data_entrada", range.end);
      }

      if (statusFilter === "em_andamento") {
        query = query.in("status", ["aberta", "em_andamento", "aguardando"]);
      }

      if (statusFilter === "finalizadas") {
        query = query.eq("status", "finalizada");
      }

      const { data: visitasData, error: visitasError } = await query;

      if (visitasError) {
        throw visitasError;
      }

      const visitasRows = (visitasData ?? []) as VisitaRow[];

      const motoIds = Array.from(
        new Set(visitasRows.map((visita) => visita.moto_id).filter(Boolean))
      ) as string[];

      const clienteIds = Array.from(
        new Set(visitasRows.map((visita) => visita.cliente_id).filter(Boolean))
      ) as string[];

      const motosMap = new Map<string, MotoRow>();
      const clientesMap = new Map<string, ClienteRow>();

      if (motoIds.length > 0) {
        const { data: motosData, error: motosError } = await supabase
          .from("motos")
          .select("id, placa, modelo, marca")
          .in("id", motoIds);

        if (motosError) {
          throw motosError;
        }

        (motosData ?? []).forEach((moto: MotoRow) => {
          motosMap.set(moto.id, moto);
        });
      }

      if (clienteIds.length > 0) {
        const { data: clientesData, error: clientesError } = await supabase
          .from("clientes")
          .select("id, nome, telefone")
          .in("id", clienteIds);

        if (clientesError) {
          throw clientesError;
        }

        (clientesData ?? []).forEach((cliente: ClienteRow) => {
          clientesMap.set(cliente.id, cliente);
        });
      }

      const formatted = visitasRows.map((visita) => {
        const moto = visita.moto_id ? motosMap.get(visita.moto_id) : null;
        const cliente = visita.cliente_id
          ? clientesMap.get(visita.cliente_id)
          : null;

        return {
          id: visita.id,
          placa: moto?.placa ?? "—",
          moto:
            [moto?.marca, moto?.modelo].filter(Boolean).join(" ") ||
            moto?.modelo ||
            "Moto não informada",
          cliente: cliente?.nome ?? "Cliente não informado",
          telefone: cliente?.telefone ?? "—",
          status: formatStatus(visita.status),
          dataEntrada: formatDateTime(visita.data_entrada),
          dataSaida: formatDateTime(visita.data_saida),
          rawStatus: visita.status ?? "",
        };
      });

      setVisitas(formatted);
    } catch (error) {
      console.error("Erro ao carregar entradas e saídas:", error);
      setVisitas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadVisitas());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFilter, statusFilter]);

  const filteredVisitas = visitas.filter((visita) => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return true;

    return (
      visita.placa.toLowerCase().includes(normalizedSearch) ||
      visita.moto.toLowerCase().includes(normalizedSearch) ||
      visita.cliente.toLowerCase().includes(normalizedSearch) ||
      visita.telefone.toLowerCase().includes(normalizedSearch)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVisitas.length / ITEMS_PER_PAGE)
  );
  const activePage = Math.min(currentPage, totalPages);
  const paginationStart = (activePage - 1) * ITEMS_PER_PAGE;
  const paginationEnd = paginationStart + ITEMS_PER_PAGE;
  const paginatedVisitas = filteredVisitas.slice(paginationStart, paginationEnd);
  const currentPageStart = filteredVisitas.length === 0 ? 0 : paginationStart + 1;
  const currentPageEnd = Math.min(paginationEnd, filteredVisitas.length);

  const totalEmAndamento = visitas.filter(
    (visita) =>
      visita.rawStatus === "aberta" || visita.rawStatus === "em_andamento"
  ).length;

  const totalFinalizadas = visitas.filter(
    (visita) => visita.rawStatus === "finalizada"
  ).length;

  async function handleFinalizarVisita() {
    if (!confirmFinalizar) return;

    try {
      setFinalizingVisitaId(confirmFinalizar.id);

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("visitas")
        .update({
          status: "finalizada",
          data_saida: now,
          updated_at: now,
        })
        .eq("id", confirmFinalizar.id);

      if (error) throw error;

      setConfirmFinalizar(null);
      await loadVisitas();
    } catch (error) {
      console.error("Erro ao finalizar atendimento:", error);
      alert("Não foi possível finalizar o atendimento.");
    } finally {
      setFinalizingVisitaId(null);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Entradas e saídas
          </p>

          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
            Controle de visitas da oficina
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-medium text-zinc-600 sm:text-base">
            Acompanhe as motos que entraram, continuam em atendimento ou já foram
            finalizadas. Os filtros usam o horário de Brasília/São Paulo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadVisitas()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-4 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <HiOutlineArrowPath size={18} />
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
            <HiOutlineClipboardDocumentList size={22} />
          </div>

          <p className="text-sm font-bold text-zinc-500">Total no filtro</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {visitas.length}
          </h3>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
            <HiOutlineClock size={22} />
          </div>

          <p className="text-sm font-bold text-zinc-500">Em andamento</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {totalEmAndamento}
          </h3>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <HiOutlineDocumentText size={22} />
          </div>

          <p className="text-sm font-bold text-zinc-500">Finalizadas</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {totalFinalizadas}
          </h3>
        </div>
      </div>

      <div className="mb-6 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">
              Período
            </p>

            <div className="flex flex-wrap gap-2">
              {periodOptions.map((option) => {
                const active = periodFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPeriodFilter(option.value);
                      setCurrentPage(1);
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                      active
                        ? "bg-[#181818] text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">
              Status
            </p>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const active = statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.value);
                      setCurrentPage(1);
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                      active
                        ? "bg-yellow-200 text-[#181818]"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por placa, cliente, moto ou telefone..."
            className="w-full rounded-2xl border border-zinc-300 bg-[#FAFAFA] px-4 py-4 text-sm font-bold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300 focus:bg-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
          <p className="text-sm font-black text-[#181818]">
            {loading
              ? "Carregando visitas..."
              : `${filteredVisitas.length} visita(s) encontrada(s)`}
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            <p className="text-sm font-bold text-zinc-500">
              Buscando entradas e saídas...
            </p>
          </div>
        ) : filteredVisitas.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <FaMotorcycle size={22} />
            </div>

            <h2 className="text-xl font-black text-[#181818]">
              Nenhuma visita encontrada
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-zinc-500">
              Tente alterar o período, status ou buscar por outra placa.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-zinc-200">
              {paginatedVisitas.map((visita) => (
                <div
                  key={visita.id}
                  className="grid gap-4 p-5 transition hover:bg-zinc-50 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center"
                >
                  <Link
                  href={`/dashboard/entradas-saidas/${visita.id}`}
                  className="block"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-[#181818] px-3 py-1 text-sm font-black text-white">
                      {visita.placa}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                        visita.rawStatus
                      )}`}
                    >
                      {visita.status}
                    </span>
                  </div>

                  <p className="text-lg font-black text-[#181818]">
                    {visita.moto}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-zinc-500">
                    Cliente: {visita.cliente}
                  </p>
                  </Link>

                  <Link
                  href={`/dashboard/entradas-saidas/${visita.id}`}
                  className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"
                >
                  <div className="rounded-2xl bg-zinc-50 p-3">
                    <p className="font-black text-zinc-500">Entrada</p>
                    <p className="mt-1 font-bold text-[#181818]">
                      {visita.dataEntrada}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3">
                    <p className="font-black text-zinc-500">Saída</p>
                    <p className="mt-1 font-bold text-[#181818]">
                      {visita.dataSaida}
                    </p>
                  </div>
                  </Link>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  {(visita.rawStatus === "aberta" ||
                    visita.rawStatus === "em_andamento") && (
                    <Link
                      href={`/dashboard/atendimentos/${visita.id}/quiz`}
                      className="rounded-2xl bg-yellow-200 px-4 py-3 text-center text-sm font-black text-[#181818] transition hover:opacity-90"
                    >
                      Continuar
                    </Link>
                  )}

                  {visita.rawStatus !== "finalizada" &&
                  visita.rawStatus !== "cancelada" ? (
                    <button
                      type="button"
                      disabled={finalizingVisitaId === visita.id}
                      onClick={() => {
                        setConfirmFinalizar(visita);
                      }}
                      className="rounded-2xl bg-[#181818] px-4 py-3 text-center text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {finalizingVisitaId === visita.id
                        ? "Finalizando..."
                        : "Finalizar"}
                    </button>
                  ) : null}

                  {visita.rawStatus === "finalizada" && (
                    <button
                      type="button"
                      onClick={() => {
                        // Depois vamos trocar isso pelo download do PDF.
                      }}
                      className="rounded-2xl border border-zinc-300 px-4 py-3 text-center text-sm font-black text-[#181818] transition hover:bg-zinc-50"
                    >
                      PDF
                    </button>
                  )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-zinc-500">
                Mostrando {currentPageStart}-{currentPageEnd} de{" "}
                {filteredVisitas.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
                  disabled={activePage === 1}
                  aria-label="Pagina anterior"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-[#181818] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <HiOutlineChevronLeft size={18} />
                </button>

                <span className="min-w-28 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#181818]">
                  {activePage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, activePage + 1))
                  }
                  disabled={activePage === totalPages}
                  aria-label="Proxima pagina"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-[#181818] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <HiOutlineChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmFinalizar ? (
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
                Placa: {confirmFinalizar.placa}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Cliente: {confirmFinalizar.cliente}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Moto: {confirmFinalizar.moto}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!!finalizingVisitaId}
                onClick={() => setConfirmFinalizar(null)}
                className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!!finalizingVisitaId}
                onClick={handleFinalizarVisita}
                className="rounded-2xl bg-[#181818] px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finalizingVisitaId ? "Finalizando..." : "Sim, finalizar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
