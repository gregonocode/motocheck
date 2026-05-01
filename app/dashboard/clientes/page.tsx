"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "../../lib/supabase/client";
import {
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlinePhone,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { FaCarSide, FaUserAlt, FaWhatsapp } from "react-icons/fa";

type ClienteRow = {
  id: string;
  nome: string | null;
  telefone: string | null;
  created_at: string | null;
};

type MotoRow = {
  id: string;
  cliente_id: string | null;
};

type VisitaRow = {
  id: string;
  cliente_id: string | null;
  status: string | null;
};

type ClienteItem = {
  id: string;
  nome: string;
  telefone: string;
  criadoEm: string;
  totalMotos: number;
  visitasAtivas: number;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function isActiveStatus(status?: string | null) {
  return status === "aberta" || status === "em_andamento" || status === "aguardando";
}

function getWhatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return null;

  const phoneWithCountryCode =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;

  return `https://wa.me/${phoneWithCountryCode}`;
}

export default function ClientesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteItem[]>([]);

  async function loadClientes() {
    try {
      setLoading(true);

      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("id, nome, telefone, created_at")
        .order("created_at", { ascending: false });

      if (clientesError) throw clientesError;

      const clientesRows = (clientesData ?? []) as ClienteRow[];
      const clienteIds = clientesRows.map((cliente) => cliente.id);

      const motosMap = new Map<string, number>();
      const visitasAtivasMap = new Map<string, number>();

      if (clienteIds.length > 0) {
        const { data: motosData, error: motosError } = await supabase
          .from("motos")
          .select("id, cliente_id")
          .in("cliente_id", clienteIds);

        if (motosError) throw motosError;

        ((motosData ?? []) as MotoRow[]).forEach((moto) => {
          if (!moto.cliente_id) return;
          motosMap.set(moto.cliente_id, (motosMap.get(moto.cliente_id) ?? 0) + 1);
        });

        const { data: visitasData, error: visitasError } = await supabase
          .from("visitas")
          .select("id, cliente_id, status")
          .in("cliente_id", clienteIds);

        if (visitasError) throw visitasError;

        ((visitasData ?? []) as VisitaRow[]).forEach((visita) => {
          if (!visita.cliente_id || !isActiveStatus(visita.status)) return;

          visitasAtivasMap.set(
            visita.cliente_id,
            (visitasAtivasMap.get(visita.cliente_id) ?? 0) + 1
          );
        });
      }

      setClientes(
        clientesRows.map((cliente) => ({
          id: cliente.id,
          nome: cliente.nome ?? "Cliente sem nome",
          telefone: cliente.telefone ?? "—",
          criadoEm: formatDate(cliente.created_at),
          totalMotos: motosMap.get(cliente.id) ?? 0,
          visitasAtivas: visitasAtivasMap.get(cliente.id) ?? 0,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadClientes();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClientes = clientes.filter((cliente) => {
    const term = search.trim().toLowerCase();

    if (!term) return true;

    return (
      cliente.nome.toLowerCase().includes(term) ||
      cliente.telefone.toLowerCase().includes(term)
    );
  });

  const totalClientes = clientes.length;
  const totalMotos = clientes.reduce((total, cliente) => total + cliente.totalMotos, 0);
  const clientesComMoto = clientes.filter((cliente) => cliente.totalMotos > 0).length;
  const atendimentosAtivos = clientes.reduce(
    (total, cliente) => total + cliente.visitasAtivas,
    0
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Clientes
          </p>

          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
            Carteira de clientes da oficina
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-medium text-zinc-600 sm:text-base">
            Consulte contatos, veiculos vinculados e clientes com atendimento ativo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 px-5 py-4 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
          >
            Voltar ao dashboard
          </Link>

          <button
            type="button"
            onClick={() => loadClientes()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-4 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <HiOutlineArrowPath size={18} />
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
            <HiOutlineUserGroup size={22} />
          </div>

          <p className="text-sm font-bold text-zinc-500">Total de clientes</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {totalClientes}
          </h3>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
            <FaCarSide size={20} />
          </div>

          <p className="text-sm font-bold text-zinc-500">Veiculos vinculados</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {totalMotos}
          </h3>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <FaUserAlt size={18} />
          </div>

          <p className="text-sm font-bold text-zinc-500">Com veiculo cadastrado</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {clientesComMoto}
          </h3>
        </div>

        <div className="rounded-[28px] bg-yellow-100 p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181818] text-yellow-100">
            <HiOutlinePhone size={22} />
          </div>

          <p className="text-sm font-bold text-zinc-600">Atendimentos ativos</p>
          <h3 className="mt-2 text-4xl font-black text-[#181818]">
            {atendimentosAtivos}
          </h3>
        </div>
      </div>

      <div className="mb-6 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-black text-[#181818]">Buscar cliente</p>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Pesquise por nome ou telefone.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border border-zinc-300 bg-[#FAFAFA] px-4 py-4 lg:max-w-xl">
            <HiOutlineMagnifyingGlass className="text-xl text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex: Carlos, 85999990000..."
              className="w-full bg-transparent text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
          <p className="text-sm font-black text-[#181818]">
            {loading
              ? "Carregando clientes..."
              : `${filteredClientes.length} cliente(s) encontrado(s)`}
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            <p className="text-sm font-bold text-zinc-500">
              Buscando clientes cadastrados...
            </p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <HiOutlineUserGroup size={24} />
            </div>

            <h2 className="text-xl font-black text-[#181818]">
              Nenhum cliente encontrado
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-zinc-500">
              Tente buscar por outro nome ou telefone.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {filteredClientes.map((cliente) => {
              const whatsappHref = getWhatsAppHref(cliente.telefone);

              return (
                <div
                  key={cliente.id}
                  className="grid gap-4 p-5 transition hover:bg-zinc-50 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-xl bg-[#181818] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                        Cliente
                      </span>

                      {cliente.visitasAtivas > 0 ? (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
                          Em atendimento
                        </span>
                      ) : null}
                    </div>

                    <p className="text-lg font-black text-[#181818]">
                      {cliente.nome}
                    </p>
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800 hover:underline"
                      >
                        <FaWhatsapp size={16} />
                        {cliente.telefone}
                      </a>
                    ) : (
                      <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500">
                        <FaWhatsapp size={16} />
                        {cliente.telefone}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-3">
                    <div className="rounded-2xl bg-zinc-50 p-3">
                      <p className="font-black text-zinc-500">Cadastro</p>
                      <p className="mt-1 font-bold text-[#181818]">
                        {cliente.criadoEm}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-3">
                      <p className="font-black text-zinc-500">Veiculos</p>
                      <p className="mt-1 font-bold text-[#181818]">
                        {cliente.totalMotos}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-3">
                      <p className="font-black text-zinc-500">Ativos</p>
                      <p className="mt-1 font-bold text-[#181818]">
                        {cliente.visitasAtivas}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-zinc-300 px-4 py-3 text-center text-sm font-black text-[#181818] transition hover:bg-white"
                  >
                    Ver painel
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
