"use client";

import Link from "next/link";
import { IoCloseCircleOutline } from "react-icons/io5";
import { MdDirectionsCar, MdOutlineBadge } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { PiMotorcycleFill } from "react-icons/pi";

export type VehicleSearchData = {
  placa: string;
  marca?: string;
  veiculo?: string;
  cilindrada?: string;
  ano?: number | string;
  cor?: string;
  cliente?: string;
  telefone?: string;
  visitaId?: string;
  status?: "Em andamento" | "Aguardando" | "Finalizada" | "Cancelada" | "Sem atendimento";
  cadastroExiste: boolean;
};

type VehicleSearchModalProps = {
  open: boolean;
  onClose: () => void;
  vehicle: VehicleSearchData | null;
  onCreateNew?: () => void;
  onOpenHistory?: () => void;
  onStartAttendance?: () => void;
  startingAttendance?: boolean;
};

function getStatusStyles(status?: VehicleSearchData["status"]) {
  switch (status) {
    case "Finalizada":
      return "border-green-200 bg-green-100 text-green-700";
    case "Em andamento":
      return "border-yellow-200 bg-yellow-100 text-yellow-700";
    case "Aguardando":
      return "border-blue-200 bg-blue-100 text-blue-700";
    case "Cancelada":
      return "border-red-200 bg-red-50 text-red-600";
    default:
      return "border-red-200 bg-red-50 text-red-600";
  }
}

function formatPlateDisplay(plate?: string) {
  if (!plate) return "—";
  const normalized = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (normalized.length === 7) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }

  return normalized;
}

export default function VehicleSearchModal({
  open,
  onClose,
  vehicle,
  onCreateNew,
  onOpenHistory,
  onStartAttendance,
  startingAttendance = false,
}: VehicleSearchModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-[22px] bg-[#efefef] shadow-[0_25px_80px_rgba(0,0,0,0.22)]">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#4b4b4b] px-5 py-4 text-white">
          <h2 className="text-lg font-extrabold sm:text-[22px]">
            Detalhes do veículo: {vehicle?.placa || "—"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="transition hover:scale-105"
          >
            <IoCloseCircleOutline size={32} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-2xl border border-zinc-300 bg-[#f8f8f8] p-4 sm:p-6">
            {vehicle?.cadastroExiste ? (
              <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
                {/* Coluna esquerda */}
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[#181818]">
                    <MdOutlineBadge size={20} />
                    <span className="text-[15px] font-black">Placa</span>
                  </div>

                  <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.10)]">
                    {/* topo da placa */}
                    <div className="flex h-8 items-center justify-between bg-[#073da7] px-4 text-white">
                      <span className="text-[10px] font-medium opacity-80">
                        MERCOSUL
                      </span>
                      <span className="text-[12px] font-bold tracking-[0.45em]">
                        BRASIL
                      </span>
                      <span className="text-lg">🇧🇷</span>
                    </div>

                    {/* corpo da placa */}
                    <div className="flex min-h-[150px] items-center gap-4 px-4 py-4 sm:px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-zinc-300 text-[10px] font-bold text-zinc-500">
                        QR
                      </div>

                      <div className="flex-1">
                        <div className="text-[42px] font-black leading-none tracking-tight text-black sm:text-[64px]">
                          {formatPlateDisplay(vehicle.placa)}
                        </div>
                        <div className="mt-2 text-[18px] font-bold text-zinc-500">
                          BR
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-[#181818]">
                      <FaUserCircle size={18} />
                      <span className="text-sm font-black">Cliente</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                          Nome
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#181818]">
                          {vehicle.cliente || "Não informado"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                          Telefone
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#181818]">
                          {vehicle.telefone || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {vehicle.status === "Sem atendimento" ||
                    vehicle.status === "Finalizada" ? (
                      <button
                        type="button"
                        onClick={onStartAttendance}
                        disabled={startingAttendance}
                        className="rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {startingAttendance
                          ? "Iniciando..."
                          : "Iniciar atendimento"}
                      </button>
                    ) : vehicle.visitaId ? (
                      <Link
                        href={`/dashboard/atendimentos/${vehicle.visitaId}/quiz`}
                        className="rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95"
                      >
                        Continuar atendimento
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenHistory}
                        className="rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95"
                      >
                        Continuar atendimento
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onOpenHistory}
                      className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
                    >
                      Ver histórico
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
                    >
                      Fechar
                    </button>
                  </div>
                </div>

                {/* Coluna direita */}
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[#181818]">
                    <PiMotorcycleFill size={18} />
                    <span className="text-[15px] font-black">Veículo</span>
                  </div>

                  <div className="rounded-2xl bg-transparent px-1 py-1">
                    <div className="space-y-3 text-[18px] leading-relaxed text-[#181818]">
                      <p>
                        <span className="font-black text-[#0b1d5c]">Marca:</span>{" "}
                        {vehicle.marca || "—"}
                      </p>

                      <p>
                        <span className="font-black text-[#0b1d5c]">Veículo:</span>{" "}
                        {vehicle.veiculo || "—"}
                      </p>

                      <p>
                        <span className="font-black text-[#0b1d5c]">
                          Cilindrada:
                        </span>{" "}
                        {vehicle.cilindrada || "—"}
                      </p>

                      <p>
                        <span className="font-black text-[#0b1d5c]">Ano:</span>{" "}
                        {vehicle.ano || "—"}
                      </p>

                      <p>
                        <span className="font-black text-[#0b1d5c]">Cor:</span>{" "}
                        {vehicle.cor || "—"}
                      </p>
                    </div>

                    <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-[#181818]">
                        <MdDirectionsCar size={18} />
                        <span className="text-sm font-black">
                          Status do atendimento
                        </span>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusStyles(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status || "Sem atendimento"}
                      </span>

                      <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
                        Aqui você pode mostrar o status mais recente da moto,
                        como atendimento em andamento, finalizado ou aguardando
                        nova entrada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center sm:py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                  <PiMotorcycleFill size={28} />
                </div>

                <h3 className="mt-5 text-2xl font-black text-[#181818]">
                  Placa não cadastrada
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-zinc-600 sm:text-base">
                  Não encontramos nenhum veículo com a placa{" "}
                  <span className="font-extrabold text-[#181818]">
                    {vehicle?.placa || "—"}
                  </span>{" "}
                  no sistema. Você pode criar um novo cadastro agora.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onCreateNew}
                    className="rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95"
                  >
                    Cadastrar veículo
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
