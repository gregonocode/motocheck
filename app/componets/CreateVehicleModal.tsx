"use client";

import { useState } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";
import { PiMotorcycleFill } from "react-icons/pi";

type CreateVehicleFormData = {
  placa: string;
  marca: string;
  modelo: string;
  cilindrada: string;
  ano: string;
  cor: string;
  cliente: string;
  telefone: string;
};

type CreateVehicleModalProps = {
  open: boolean;
  onClose: () => void;
  initialPlate?: string;
  onSubmit: (data: CreateVehicleFormData) => Promise<void> | void;
  loading?: boolean;
};

function normalizePlate(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export default function CreateVehicleModal({
  open,
  onClose,
  initialPlate = "",
  onSubmit,
  loading = false,
}: CreateVehicleModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<CreateVehicleFormData>({
    placa: normalizePlate(initialPlate),
    marca: "",
    modelo: "",
    cilindrada: "",
    ano: "",
    cor: "",
    cliente: "",
    telefone: "",
  });

  function updateField<K extends keyof CreateVehicleFormData>(
    field: K,
    value: CreateVehicleFormData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const vehicleStepComplete =
    normalizePlate(form.placa).length > 0 &&
    form.marca.trim().length > 0 &&
    form.modelo.trim().length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vehicleStepComplete || form.cliente.trim().length === 0) return;

    await onSubmit({
      ...form,
      placa: normalizePlate(form.placa),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      cilindrada: form.cilindrada.trim(),
      ano: form.ano.trim(),
      cor: form.cor.trim().toUpperCase(),
      cliente: form.cliente.trim(),
      telefone: form.telefone.trim(),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-3 sm:p-4">
      <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] bg-[#efefef] shadow-[0_25px_80px_rgba(0,0,0,0.22)] sm:max-h-[calc(100dvh-32px)]">
        <div className="flex items-center justify-between gap-3 bg-[#4b4b4b] px-4 py-3 text-white sm:px-5 sm:py-4">
          <h2 className="text-base font-extrabold sm:text-[22px]">
            Cadastrar novo veículo
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

        <form onSubmit={handleSubmit} className="overflow-y-auto p-3 sm:p-5">
          <div className="rounded-2xl border border-zinc-300 bg-[#f8f8f8] p-4 sm:p-6">
            <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition ${
                  activeStep === 1
                    ? "border-[#181818] bg-[#181818] text-white"
                    : "border-zinc-300 bg-white text-[#181818]"
                }`}
              >
                1. Moto
              </button>

              <button
                type="button"
                onClick={() => {
                  if (vehicleStepComplete) setActiveStep(2);
                }}
                disabled={!vehicleStepComplete}
                className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  activeStep === 2
                    ? "border-[#181818] bg-[#181818] text-white"
                    : "border-zinc-300 bg-white text-[#181818]"
                }`}
              >
                2. Cliente
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={activeStep === 1 ? "block" : "hidden md:block"}>
                <div className="mb-4 flex items-center gap-2 text-[#181818]">
                  <PiMotorcycleFill size={18} />
                  <span className="text-[15px] font-black">
                    Dados da moto
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Placa
                    </label>
                    <input
                      type="text"
                      value={form.placa}
                      onChange={(e) =>
                        updateField("placa", normalizePlate(e.target.value))
                      }
                      placeholder="Ex: QWE1A23"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold uppercase text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={form.marca}
                      onChange={(e) => updateField("marca", e.target.value)}
                      placeholder="Honda"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => updateField("modelo", e.target.value)}
                      placeholder="CG 125 Fan"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Cilindrada
                    </label>
                    <input
                      type="text"
                      value={form.cilindrada}
                      onChange={(e) =>
                        updateField("cilindrada", e.target.value)
                      }
                      placeholder="0.125"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Ano
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.ano}
                      onChange={(e) => updateField("ano", e.target.value)}
                      placeholder="2013"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Cor
                    </label>
                    <input
                      type="text"
                      value={form.cor}
                      onChange={(e) => updateField("cor", e.target.value)}
                      placeholder="PRETA"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold uppercase text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                    />
                  </div>
                </div>
              </div>

              <div className={activeStep === 2 ? "block" : "hidden md:block"}>
                <div className="mb-4 flex items-center gap-2 text-[#181818]">
                  <FaUserCircle size={18} />
                  <span className="text-[15px] font-black">
                    Dados do cliente
                  </span>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Nome do cliente
                    </label>
                    <input
                      type="text"
                      value={form.cliente}
                      onChange={(e) => updateField("cliente", e.target.value)}
                      placeholder="Carlos Henrique"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-[#181818]">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={form.telefone}
                      onChange={(e) => updateField("telefone", e.target.value)}
                      placeholder="(93) 99999-0000"
                      className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300"
                    />
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-sm font-bold text-zinc-500">
                      Observação
                    </p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-600">
                      Primeiro vamos salvar cliente e moto. Depois você pode
                      evoluir para entrada, checklist, saída e histórico.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {activeStep === 2 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="order-2 rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50 sm:order-none md:hidden"
                >
                  Voltar
                </button>
              )}

              {activeStep === 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  disabled={!vehicleStepComplete}
                  className="order-1 rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:order-none md:hidden"
                >
                  Continuar
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`order-1 rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:order-none ${
                  activeStep === 1 ? "hidden md:inline-flex" : ""
                }`}
              >
                {loading ? "Salvando..." : "Salvar cadastro"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="order-3 rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50 sm:order-none"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
