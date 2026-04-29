"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
} from "react-icons/hi2";
import { FaMotorcycle, FaCheckCircle } from "react-icons/fa";
import { Zap } from "lucide-react";

type AtendimentoItem = {
  id: string;
  placa: string;
  cliente: string;
  moto: string;
  status: "Em andamento" | "Aguardando" | "Finalizada" | "Cancelada" | "Sem atendimento";
  entrada: string;
  saida?: string | null;
};

function getStatusClasses(status: AtendimentoItem["status"]) {
  switch (status) {
    case "Finalizada":
      return "bg-green-100 text-green-700";
    case "Em andamento":
      return "bg-yellow-100 text-yellow-700";
    case "Aguardando":
      return "bg-blue-100 text-blue-700";
    case "Cancelada":
      return "bg-red-100 text-red-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export default function AtendimentosPage() {
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Em andamento" | "Finalizada" | "Aguardando">("Todos");
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [loadingAtendimentos, setLoadingAtendimentos] = useState(true);

  function formatStatus(status?: string | null): AtendimentoItem["status"] {
    if (status === "aberta" || status === "em_andamento") return "Em andamento";
    if (status === "aguardando") return "Aguardando";
    if (status === "finalizada") return "Finalizada";
    if (status === "cancelada") return "Cancelada";
    return "Sem atendimento";
  }

  async function loadAtendimentos() {
    try {
      setLoadingAtendimentos(true);

      const { data: visitas, error: visitasError } = await supabase
        .from("visitas")
        .select("id, status, data_entrada, data_saida, moto_id, cliente_id")
        .order("data_entrada", { ascending: false });

      if (visitasError) throw visitasError;

      if (!visitas || visitas.length === 0) {
        setAtendimentos([]);
        return;
      }

      const motoIds = [
        ...new Set(visitas.map((item) => item.moto_id).filter(Boolean)),
      ];
      const clienteIds = [
        ...new Set(visitas.map((item) => item.cliente_id).filter(Boolean)),
      ];

      const { data: motos, error: motosError } = motoIds.length
        ? await supabase.from("motos").select("id, placa, modelo").in("id", motoIds)
        : { data: [], error: null };

      if (motosError) throw motosError;

      const { data: clientes, error: clientesError } = clienteIds.length
        ? await supabase.from("clientes").select("id, nome").in("id", clienteIds)
        : { data: [], error: null };

      if (clientesError) throw clientesError;

      const motosMap = new Map((motos || []).map((m) => [m.id, m]));
      const clientesMap = new Map((clientes || []).map((c) => [c.id, c]));

      const formatted: AtendimentoItem[] = visitas.map((visita) => {
        const moto = motosMap.get(visita.moto_id);
        const cliente = clientesMap.get(visita.cliente_id);

        return {
          id: visita.id,
          placa: moto?.placa ?? "—",
          cliente: cliente?.nome ?? "Não informado",
          moto: moto?.modelo ?? "Não informado",
          status: formatStatus(visita.status),
          entrada: visita.data_entrada
            ? new Date(visita.data_entrada).toLocaleString("pt-BR")
            : "—",
          saida: visita.data_saida
            ? new Date(visita.data_saida).toLocaleString("pt-BR")
            : null,
        };
      });

      setAtendimentos(formatted);
    } catch (error) {
      console.error("Erro ao carregar atendimentos:", error);
      toast.error("Não foi possível carregar os atendimentos.");
    } finally {
      setLoadingAtendimentos(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAtendimentos();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAtendimentos = atendimentos.filter((item) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      item.placa.toLowerCase().includes(term) ||
      item.cliente.toLowerCase().includes(term) ||
      item.moto.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "Todos" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAtendimentos = atendimentos.length;
  const emAndamento = atendimentos.filter((item) => item.status === "Em andamento").length;
  const finalizados = atendimentos.filter((item) => item.status === "Finalizada").length;
  const aguardando = atendimentos.filter((item) => item.status === "Aguardando").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Atendimentos
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
            Gerencie os atendimentos da oficina.
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-zinc-600 sm:text-base">
            Veja atendimentos em andamento, finalizados e aguardando. Aqui será
            o ponto central para abrir cada visita e seguir no fluxo estilo quiz.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-2xl border border-zinc-300 px-5 py-4 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
          >
            Voltar ao dashboard
          </Link>

          <button className="rounded-2xl bg-[#181818] px-5 py-4 text-sm font-extrabold text-white transition hover:opacity-95">
            Novo atendimento
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-200 text-[#181818]">
            <HiOutlineClipboardDocumentList size={20} />
          </div>
          <p className="text-sm font-bold text-zinc-500">Total de atendimentos</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {totalAtendimentos}
          </h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            Registros encontrados no sistema
          </p>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
            <Zap size={20} />
          </div>
          <p className="text-sm font-bold text-zinc-500">Em andamento</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {emAndamento}
          </h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            Atendimentos ativos no momento
          </p>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
            <FaCheckCircle size={20} />
          </div>
          <p className="text-sm font-bold text-zinc-500">Finalizados</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {finalizados}
          </h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            Atendimentos concluídos
          </p>
        </div>

        <div className="rounded-[28px] bg-yellow-100 p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181818] text-yellow-100">
            <HiOutlineClock size={20} />
          </div>
          <p className="text-sm font-bold text-zinc-600">Aguardando</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {aguardando}
          </h3>
          <p className="mt-2 text-sm font-medium text-zinc-600">
            Registros aguardando continuidade
          </p>
        </div>
      </div>

      {/* Busca + filtros */}
      <div className="mb-8 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-lg font-black text-[#181818]">
              Buscar atendimento
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Pesquise por placa, cliente ou modelo da moto.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 xl:max-w-3xl xl:flex-row">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 py-4">
              <HiOutlineMagnifyingGlass className="text-xl text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex: QEA4209, Carlos Henrique..."
                className="w-full bg-transparent text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["Todos", "Em andamento", "Finalizada", "Aguardando"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                      statusFilter === status
                        ? "bg-[#181818] text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista desktop */}
      <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#181818]">
              Lista de atendimentos
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Selecione um atendimento para abrir o fluxo completo.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-extrabold text-zinc-700">
            {filteredAtendimentos.length} resultado(s)
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden overflow-hidden rounded-3xl border border-zinc-200 lg:block">
          <div className="grid grid-cols-6 bg-zinc-50 px-5 py-4 text-sm font-extrabold text-zinc-600">
            <span>Placa</span>
            <span>Cliente</span>
            <span>Moto</span>
            <span>Status</span>
            <span>Entrada</span>
            <span>Ação</span>
          </div>

          {loadingAtendimentos ? (
            <div className="px-5 py-10 text-center text-sm font-semibold text-zinc-500">
              Carregando atendimentos...
            </div>
          ) : filteredAtendimentos.length ? (
            filteredAtendimentos.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-6 items-center border-t border-zinc-200 px-5 py-4 text-sm font-semibold text-[#181818]"
              >
                <span className="font-black">{item.placa}</span>
                <span>{item.cliente}</span>
                <span>{item.moto}</span>
                <span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </span>
                <span>{item.entrada}</span>
                <span>
                  <Link
                    href={`/dashboard/atendimentos/${item.id}`}
                    className="inline-flex rounded-xl bg-[#181818] px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-95"
                  >
                    Abrir atendimento
                  </Link>
                </span>
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm font-semibold text-zinc-500">
              Nenhum atendimento encontrado.
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="space-y-4 lg:hidden">
          {loadingAtendimentos ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-[#fafafa] p-8 text-center">
              <p className="text-lg font-black text-[#181818]">
                Carregando atendimentos...
              </p>
            </div>
          ) : filteredAtendimentos.length ? (
            filteredAtendimentos.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-zinc-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-[#181818]">
                      {item.placa}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {item.moto}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-bold text-zinc-500">Cliente</p>
                    <p className="font-semibold text-[#181818]">
                      {item.cliente}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-zinc-500">Entrada</p>
                    <p className="font-semibold text-[#181818]">
                      {item.entrada}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/dashboard/atendimentos/${item.id}`}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#181818] px-4 py-3 text-sm font-extrabold text-white transition hover:opacity-95"
                  >
                    Abrir atendimento
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-[#fafafa] p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                <FaMotorcycle size={22} />
              </div>
              <p className="text-lg font-black text-[#181818]">
                Nenhum atendimento encontrado
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Tente ajustar a busca ou o filtro selecionado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
