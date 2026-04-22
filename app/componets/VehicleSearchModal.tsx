"use client";

import { IoCloseCircleOutline } from "react-icons/io5";
import { PiMotorcycleFill } from "react-icons/pi";
import { MdOutlineBadge } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";

type VehicleStatus =
  | "Em andamento"
  | "Finalizada"
  | "Aguardando"
  | "Sem atendimento";

type RegisteredVehicleData = {
  placa: string;
  marca: string;
  veiculo: string;
  cilindrada: string;
  ano: number | string;
  cor: string;
  cliente?: string;
  telefone?: string;
  status?: VehicleStatus;
  cadastroExiste: true;
};

type UnregisteredVehicleData = {
  placa: string;
  cadastroExiste: false;
};

export type VehicleData = RegisteredVehicleData | UnregisteredVehicleData;

type VehicleSearchModalProps = {
  open: boolean;
  onClose: () => void;
  vehicle: VehicleData | null;
  onCreateNew?: () => void;
  onOpenHistory?: () => void;
};

function getStatusClasses(status?: VehicleStatus) {
  switch (status) {
    case "Finalizada":
      return "bg-green-100 text-green-700 border-green-200";
    case "Em andamento":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Aguardando":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-red-50 text-red-600 border-red-200";
  }
}

export default function VehicleSearchModal({
  open,
  onClose,
  vehicle,
  onCreateNew,
  onOpenHistory,
}: VehicleSearchModalProps) {
  if (!open || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-[22px] bg-[#f2f2f2] shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between bg-[#4a4a4a] px-5 py-4 text-white">
          <h2 className="text-lg font-extrabold sm:text-xl">
            Detalhes do veiculo: {vehicle.placa}
          </h2>

          <button
            onClick={onClose}
            className="rounded-full text-white transition hover:scale-105 hover:opacity-90"
            aria-label="Fechar modal"
          >
            <IoCloseCircleOutline size={30} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-2xl border border-zinc-300 bg-white p-4 sm:p-6">
            {vehicle.cadastroExiste ? (
              <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[#181818]">
                    <MdOutlineBadge size={20} />
                    <span className="text-[15px] font-black">Placa</span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                    <div className="flex h-8 items-center justify-between bg-[#083da7] px-4 text-white">
                      <span className="text-[10px] font-medium tracking-wide opacity-80">
                        MERCOSUL
                      </span>
                      <span className="text-xs font-bold tracking-[0.45em]">
                        BRASIL
                      </span>
                      <span className="text-lg">BR</span>
                    </div>

                    <div className="flex min-h-[150px] items-center gap-4 px-4 py-4 sm:px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-zinc-300 text-[10px] font-bold text-zinc-500">
                        QR
                      </div>

                      <div className="flex-1">
                        <div className="text-[44px] font-black leading-none tracking-tight text-black sm:text-[62px]">
                          {vehicle.placa}
                        </div>
                        <div className="mt-2 text-[18px] font-bold text-zinc-500">
                          BR
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={onOpenHistory}
                      className="rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95"
                    >
                      Ver historico
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
                    >
                      Fechar
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-[#181818]">
                    <span className="text-[15px] font-black">Veiculo</span>
                  </div>

                  <div className="space-y-3 text-[18px] leading-relaxed text-[#181818]">
                    <p>
                      <span className="font-black text-[#0b1d5c]">Marca:</span>{" "}
                      {vehicle.marca}
                    </p>
                    <p>
                      <span className="font-black text-[#0b1d5c]">
                        Veiculo:
                      </span>{" "}
                      {vehicle.veiculo}
                    </p>
                    <p>
                      <span className="font-black text-[#0b1d5c]">
                        Cilindrada:
                      </span>{" "}
                      {vehicle.cilindrada}
                    </p>
                    <p>
                      <span className="font-black text-[#0b1d5c]">Ano:</span>{" "}
                      {vehicle.ano}
                    </p>
                    <p>
                      <span className="font-black text-[#0b1d5c]">Cor:</span>{" "}
                      {vehicle.cor}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-[#fafafa] p-4">
                    <div className="mb-3 flex items-center gap-2 text-[#181818]">
                      <FaUserCircle size={18} />
                      <span className="text-sm font-black">Cliente</span>
                    </div>

                    <div className="space-y-2 text-sm text-zinc-700">
                      <p>
                        <span className="font-extrabold text-[#181818]">
                          Nome:
                        </span>{" "}
                        {vehicle.cliente || "Nao informado"}
                      </p>
                      <p>
                        <span className="font-extrabold text-[#181818]">
                          Telefone:
                        </span>{" "}
                        {vehicle.telefone || "Nao informado"}
                      </p>
                      <div className="pt-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                            vehicle.status
                          )}`}
                        >
                          {vehicle.status || "Sem atendimento"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center sm:py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                  <PiMotorcycleFill size={28} />
                </div>

                <h3 className="mt-5 text-2xl font-black text-[#181818]">
                  Placa nao cadastrada
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-zinc-600 sm:text-base">
                  Nao encontramos nenhum veiculo com a placa{" "}
                  <span className="font-extrabold text-[#181818]">
                    {vehicle.placa}
                  </span>{" "}
                  no sistema. Voce pode criar um novo cadastro agora.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={onCreateNew}
                    className="rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95"
                  >
                    Cadastrar veiculo
                  </button>

                  <button
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
