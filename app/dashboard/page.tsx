"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import VehicleSearchModal from "@/app/componets/VehicleSearchModal";
import type { VehicleData } from "@/app/componets/VehicleSearchModal";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRightOnRectangle,
  HiOutlineClock,
  HiOutlineCog,
} from "react-icons/hi2";
import { FaCheckCircle } from "react-icons/fa";
import { CgSearchFound } from "react-icons/cg";
import { Settings, Zap } from "lucide-react";

type VehicleLookupResult = VehicleData;

export default function DashboardPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [plate, setPlate] = useState("");
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleLookupResult | null>(null);

  const vehiclesMock = useMemo(
    () => [
      {
        placa: "QEA4209",
        marca: "Honda",
        veiculo: "Nxr 160 Bros",
        cilindrada: "0.16",
        ano: 2016,
        cor: "PRETA",
        cliente: "João Pedro",
        telefone: "(93) 99123-4567",
        status: "Em andamento" as const,
        cadastroExiste: true,
      },
      {
        placa: "QWE1A23",
        marca: "Honda",
        veiculo: "CG 125 Fan",
        cilindrada: "0.125",
        ano: 2013,
        cor: "PRETA",
        cliente: "Carlos Henrique",
        telefone: "(93) 99999-0000",
        status: "Finalizada" as const,
        cadastroExiste: true,
      },
      {
        placa: "ABC4D56",
        marca: "Yamaha",
        veiculo: "Factor 150",
        cilindrada: "0.15",
        ano: 2020,
        cor: "VERMELHA",
        cliente: "Marcos Silva",
        telefone: "(93) 98888-1111",
        status: "Aguardando" as const,
        cadastroExiste: true,
      },
    ],
    []
  );

  function normalizePlate(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  function handleSearchVehicle() {
    const normalized = normalizePlate(plate);

    if (!normalized) return;

    const found = vehiclesMock.find(
      (item) => normalizePlate(item.placa) === normalized
    );

    if (found) {
      setSelectedVehicle(found);
    } else {
      setSelectedVehicle({
        placa: normalized,
        cadastroExiste: false,
      });
    }

    setVehicleModalOpen(true);
  }

  function handleLogout() {
    setDropdownOpen(false);
    setHeaderDropdownOpen(false);
    router.replace("/login");
  }

  const atendimentos = [
    {
      placa: "QWE1A23",
      cliente: "Carlos Henrique",
      moto: "Honda CG 125 Fan",
      status: "Em andamento",
      entrada: "09:12",
    },
    {
      placa: "ABC4D56",
      cliente: "Marcos Silva",
      moto: "Yamaha Factor 150",
      status: "Finalizada",
      entrada: "08:40",
    },
    {
      placa: "JKL8M90",
      cliente: "Rafael Souza",
      moto: "Honda Biz 125",
      status: "Aguardando",
      entrada: "10:05",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Topbar mobile */}
      <div className="mb-6 flex items-center justify-between xl:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181818] text-yellow-200">
            <CgSearchFound size={20} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-zinc-500">
              Sistema
            </p>
            <h1 className="text-xl font-black">MotoCheck</h1>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
          >
            <HiOutlineCog size={20} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-48 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-zinc-600 transition hover:bg-zinc-100"
              >
                <HiOutlineArrowRightOnRectangle size={16} />
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>

          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
                Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
                Controle rápido da sua MotoPeças.
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-zinc-600 sm:text-base">
                Busque motos por placa, acompanhe atendimentos em aberto e veja
                o histórico recente da operação em um só lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-yellow-200 px-5 py-4 text-sm font-extrabold text-[#181818] transition hover:opacity-95">
                Nova entrada
              </button>
              <button className="rounded-2xl bg-[#181818] px-5 py-4 text-sm font-extrabold text-white transition hover:opacity-95">
                Novo checklist
              </button>
              <div className="relative">
                <button
                  onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
                >
                  <Settings size={20} />
                </button>
                {headerDropdownOpen && (
                  <div className="absolute right-0 top-16 w-48 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-zinc-600 transition hover:bg-zinc-100"
                    >
                      <HiOutlineArrowRightOnRectangle size={16} />
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <Image
              src="/banner.png"
              alt="Banner MotoCheck"
              width={1250}
              height={160}
              className="h-auto w-full"
              preload
            />
          </div>

          {/* Busca */}
          <div className="mb-8 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-black text-[#181818]">
                  Buscar moto por placa
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  Digite a placa para localizar rapidamente o cadastro e o
                  histórico da moto.
                </p>
              </div>

              <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 py-4">
                <HiOutlineMagnifyingGlass className="text-xl text-zinc-500" />
                <input
                  type="text"
                  placeholder="Ex: QWE1A23"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchVehicle();
                    }
                  }}
                  className="w-full bg-transparent text-sm font-semibold uppercase text-[#181818] outline-none placeholder:text-zinc-400"
                />
                <button
                  onClick={handleSearchVehicle}
                  className="rounded-xl bg-[#181818] px-4 py-2 text-sm font-extrabold text-white"
                >
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-200 text-[#181818]">
                <CgSearchFound size={20} />
              </div>
              <p className="text-sm font-bold text-zinc-500">
                Motos cadastradas
              </p>
              <h3 className="mt-2 text-4xl font-black text-[#181818]">248</h3>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Total registrado no sistema
              </p>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                <Zap size={20} />
              </div>
              <p className="text-sm font-bold text-zinc-500">Em andamento</p>
              <h3 className="mt-2 text-4xl font-black text-[#181818]">12</h3>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Atendimentos abertos agora
              </p>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                <FaCheckCircle size={20} />
              </div>
              <p className="text-sm font-bold text-zinc-500">Finalizadas hoje</p>
              <h3 className="mt-2 text-4xl font-black text-[#181818]">19</h3>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Saídas registradas hoje
              </p>
            </div>

            <div className="rounded-[28px] bg-yellow-100 p-5 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181818] text-yellow-100">
                <HiOutlineClock size={20} />
              </div>
              <p className="text-sm font-bold text-zinc-600">
                Tempo médio de permanência
              </p>
              <h3 className="mt-2 text-4xl font-black text-[#181818]">2h 35m</h3>
              <p className="mt-2 text-sm font-medium text-zinc-600">
                Média das últimas visitas
              </p>
            </div>
          </div>

          {/* Ações + Atendimentos */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            {/* Ações rápidas */}
            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-[#181818]">
                  Ações rápidas
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  Acesse os fluxos mais usados no balcão.
                </p>
              </div>

              <div className="space-y-3">
                <button className="flex w-full items-center justify-between rounded-2xl bg-yellow-200 px-4 py-4 text-left text-sm font-extrabold text-[#181818] transition hover:opacity-95">
                  <span>Novo atendimento</span>
                  <span>→</span>
                </button>

                <button className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 px-4 py-4 text-left text-sm font-extrabold text-[#181818] transition hover:bg-zinc-200">
                  <span>Registrar entrada com foto</span>
                  <span>→</span>
                </button>

                <button className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 px-4 py-4 text-left text-sm font-extrabold text-[#181818] transition hover:bg-zinc-200">
                  <span>Preencher checklist</span>
                  <span>→</span>
                </button>

                <button className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 px-4 py-4 text-left text-sm font-extrabold text-[#181818] transition hover:bg-zinc-200">
                  <span>Registrar saída</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Tabela / lista */}
            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#181818]">
                    Atendimentos recentes
                  </h2>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    Últimas entradas registradas no sistema.
                  </p>
                </div>

                <button className="rounded-2xl bg-[#181818] px-4 py-3 text-sm font-extrabold text-white">
                  Ver tudo
                </button>
              </div>

              <div className="hidden overflow-hidden rounded-3xl border border-zinc-200 lg:block">
                <div className="grid grid-cols-5 bg-zinc-50 px-5 py-4 text-sm font-extrabold text-zinc-600">
                  <span>Placa</span>
                  <span>Cliente</span>
                  <span>Moto</span>
                  <span>Status</span>
                  <span>Entrada</span>
                </div>

                {atendimentos.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 items-center border-t border-zinc-200 px-5 py-4 text-sm font-semibold text-[#181818]"
                  >
                    <span className="font-black">{item.placa}</span>
                    <span>{item.cliente}</span>
                    <span>{item.moto}</span>
                    <span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                          item.status === "Finalizada"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Em andamento"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </span>
                    <span>{item.entrada}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 lg:hidden">
                {atendimentos.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-zinc-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-[#181818]">
                          {item.placa}
                        </p>
                        <p className="text-sm font-medium text-zinc-500">
                          {item.moto}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                          item.status === "Finalizada"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Em andamento"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          <VehicleSearchModal
            open={vehicleModalOpen}
            onClose={() => setVehicleModalOpen(false)}
            vehicle={selectedVehicle}
            onCreateNew={() => {
              setVehicleModalOpen(false);
              alert("Aqui você pode redirecionar para a tela de cadastro.");
            }}
            onOpenHistory={() => {
              setVehicleModalOpen(false);
              alert("Aqui você pode abrir o histórico da moto.");
            }}
          />
        </div>
      );
    }
