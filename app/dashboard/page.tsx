//app\dashboard\page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Html5Qrcode } from "html5-qrcode";
import CreateVehicleModal from "@/app/components/CreateVehicleModal";
import VehicleSearchModal, {
  VehicleSearchData,
} from "@/app/components/VehicleSearchModal";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRightOnRectangle,
  HiOutlineClock,
  HiOutlineQrCode,
  HiOutlineXMark,
} from "react-icons/hi2";
import { FaCheckCircle } from "react-icons/fa";
import { CgSearchFound } from "react-icons/cg";
import { Settings, Zap } from "lucide-react";

type DashboardResumo = {
  motos_cadastradas: number;
  atendimentos_abertos: number;
  finalizadas_hoje: number;
  tempo_medio_permanencia_min: number;
};

type AtendimentoRecente = {
  id: string;
  status: string | null;
  data_entrada: string | null;
  data_saida: string | null;
  created_at: string | null;
  moto_id: string | null;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  status_label: string | null;
  entrada_hora: string | null;
  entrada_formatada: string | null;
};

const defaultResumo: DashboardResumo = {
  motos_cadastradas: 0,
  atendimentos_abertos: 0,
  finalizadas_hoje: 0,
  tempo_medio_permanencia_min: 0,
};

function formatTempoMedio(minutes?: number | null) {
  const total = Number(minutes ?? 0);

  if (!total || total <= 0) return "0m";

  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  if (horas <= 0) return `${minutos}m`;

  return `${horas}h ${minutos}m`;
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

function formatMoto(item: AtendimentoRecente) {
  const moto = [item.marca, item.modelo].filter(Boolean).join(" ");
  return moto || item.modelo || "Moto não informada";
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const qrScannerInstanceRef = useRef<Html5Qrcode | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);

  const [plate, setPlate] = useState("");
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleSearchData | null>(null);
  const [searchingVehicle, setSearchingVehicle] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [createVehicleModalOpen, setCreateVehicleModalOpen] = useState(false);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [startingAttendance, setStartingAttendance] = useState(false);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [resumo, setResumo] = useState<DashboardResumo>(defaultResumo);
  const [atendimentos, setAtendimentos] = useState<AtendimentoRecente[]>([]);

  function getQuizPathFromQr(decodedText: string) {
    try {
      const url = new URL(decodedText);
      const isSameHost =
        typeof window !== "undefined" && url.host === window.location.host;

      const isQuizPath =
        url.pathname.startsWith("/dashboard/atendimentos/") &&
        url.pathname.endsWith("/quiz");

      if (!isSameHost || !isQuizPath) return null;

      return `${url.pathname}${url.search}`;
    } catch {
      const isRelativeQuizPath =
        decodedText.startsWith("/dashboard/atendimentos/") &&
        decodedText.endsWith("/quiz");

      return isRelativeQuizPath ? decodedText : null;
    }
  }

  function normalizePlate(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  async function loadDashboardData() {
    try {
      setLoadingDashboard(true);

      const { data: resumoData, error: resumoError } = await supabase
        .from("dashboard_resumo")
        .select(
          "motos_cadastradas, atendimentos_abertos, finalizadas_hoje, tempo_medio_permanencia_min"
        )
        .maybeSingle();

      if (resumoError) throw resumoError;

      setResumo({
        motos_cadastradas: resumoData?.motos_cadastradas ?? 0,
        atendimentos_abertos: resumoData?.atendimentos_abertos ?? 0,
        finalizadas_hoje: resumoData?.finalizadas_hoje ?? 0,
        tempo_medio_permanencia_min:
          resumoData?.tempo_medio_permanencia_min ?? 0,
      });

      const { data: recentesData, error: recentesError } = await supabase
        .from("dashboard_atendimentos_recentes")
        .select(
          "id, status, data_entrada, data_saida, created_at, moto_id, placa, marca, modelo, cliente_id, cliente_nome, cliente_telefone, status_label, entrada_hora, entrada_formatada"
        );

      if (recentesError) throw recentesError;

      setAtendimentos((recentesData ?? []) as AtendimentoRecente[]);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      toast.error("Não foi possível carregar os dados do dashboard.");
    } finally {
      setLoadingDashboard(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadDashboardData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scannerOpen) return;

    let cancelled = false;

    async function startScanner() {
      try {
        setScannerLoading(true);

        const { Html5Qrcode } = await import("html5-qrcode");

        if (cancelled) return;

        const scannerElementId = "motocheck-qr-scanner";

        const scanner = new Html5Qrcode(scannerElementId);
        qrScannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 240,
              height: 240,
            },
          },
          async (decodedText: string) => {
            const path = getQuizPathFromQr(decodedText);

            if (!path) {
              toast.error("QR Code inválido para este sistema.");
              return;
            }

            try {
              await scanner.stop();
              await scanner.clear();
            } catch {
              // Ignora erro ao limpar câmera.
            }

            qrScannerInstanceRef.current = null;
            setScannerOpen(false);
            router.push(path);
          },
          () => {
            // Leitura em andamento; não precisa exibir erro a cada frame.
          }
        );
      } catch (error) {
        console.error("Erro ao abrir scanner:", error);
        toast.error("Não foi possível abrir a câmera para escanear.");
        setScannerOpen(false);
      } finally {
        setScannerLoading(false);
      }
    }

    void Promise.resolve().then(() => startScanner());

    return () => {
      cancelled = true;

      const scanner = qrScannerInstanceRef.current;

      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // Ignora erro ao fechar câmera.
          });

        qrScannerInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      router.push("/login");
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
      toast.error("Não foi possível sair da conta.");
    }
  }

  async function handleSearchVehicle(customPlate?: string) {
    const normalized = normalizePlate(customPlate ?? plate);

    if (!normalized) {
      setSearchError("Digite uma placa para buscar.");
      return;
    }

    setSearchError("");
    setSearchingVehicle(true);

    try {
      const { data: moto, error: motoError } = await supabase
        .from("motos")
        .select("*")
        .eq("placa", normalized)
        .maybeSingle();

      if (motoError) {
        throw motoError;
      }

      if (!moto) {
        setSelectedVehicle({
          placa: normalized,
          cadastroExiste: false,
        });
        setVehicleModalOpen(true);
        return;
      }

      let clienteNome = "";
      let clienteTelefone = "";

      if (moto.cliente_id) {
        const { data: cliente, error: clienteError } = await supabase
          .from("clientes")
          .select("nome, telefone")
          .eq("id", moto.cliente_id)
          .maybeSingle();

        if (clienteError) {
          throw clienteError;
        }

        clienteNome = cliente?.nome ?? "";
        clienteTelefone = cliente?.telefone ?? "";
      }

      const { data: ultimaVisita, error: visitaError } = await supabase
        .from("visitas")
        .select("id, status, data_entrada")
        .eq("moto_id", moto.id)
        .order("data_entrada", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (visitaError) {
        throw visitaError;
      }

      const statusMap: Record<string, VehicleSearchData["status"]> = {
        aberta: "Em andamento",
        em_andamento: "Em andamento",
        aguardando: "Aguardando",
        finalizada: "Finalizada",
        cancelada: "Cancelada",
      };

      setSelectedVehicle({
        placa: moto.placa,
        marca: moto.marca ?? "",
        veiculo: moto.modelo ?? "",
        cilindrada: moto.cilindrada ?? "",
        ano: moto.ano ?? "",
        cor: moto.cor ?? "",
        cliente: clienteNome,
        telefone: clienteTelefone,
        visitaId: ultimaVisita?.id,
        status: ultimaVisita?.status
          ? statusMap[ultimaVisita.status] ?? "Sem atendimento"
          : "Sem atendimento",
        cadastroExiste: true,
      });

      setVehicleModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar veículo:", error);
      setSearchError("Não foi possível buscar a placa agora.");
    } finally {
      setSearchingVehicle(false);
    }
  }

  async function handleStartAttendance() {
    if (!selectedVehicle?.cadastroExiste || !selectedVehicle?.placa) return;

    try {
      setStartingAttendance(true);

      const normalized = normalizePlate(selectedVehicle.placa);

      const { data: moto, error: motoError } = await supabase
        .from("motos")
        .select("id, cliente_id, placa")
        .eq("placa", normalized)
        .maybeSingle();

      if (motoError) throw motoError;

      if (!moto) {
        toast.error("Moto não encontrada para iniciar atendimento.");
        return;
      }

      const { data: visitaAberta, error: visitaAbertaError } = await supabase
        .from("visitas")
        .select("id, status, atendente_id")
        .eq("moto_id", moto.id)
        .in("status", ["aberta", "em_andamento", "aguardando"])
        .order("data_entrada", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (visitaAbertaError) throw visitaAbertaError;

      if (visitaAberta) {
        toast("Já existe um atendimento em andamento para esta moto.");
        await handleSearchVehicle(selectedVehicle.placa);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const { data: usuarioEncontrado, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      let usuario = usuarioEncontrado;

      if (usuarioError) {
        throw usuarioError;
      }

      if (!usuario) {
        const { data: novoUsuario, error: novoUsuarioError } = await supabase
          .from("usuarios")
          .insert({
            auth_user_id: user.id,
            email: user.email ?? null,
            nome:
              user.user_metadata?.nome ??
              user.user_metadata?.name ??
              user.email?.split("@")[0] ??
              "Usuário",
          })
          .select("id")
          .single();

        if (novoUsuarioError) {
          throw novoUsuarioError;
        }

        usuario = novoUsuario;
      }

      if (!usuario?.id) {
        throw new Error("ID do usuário local não encontrado.");
      }

      const { data: novaVisita, error: visitaInsertError } = await supabase
        .from("visitas")
        .insert({
          moto_id: moto.id,
          cliente_id: moto.cliente_id ?? null,
          atendente_id: usuario.id,
          status: "em_andamento",
          data_entrada: new Date().toISOString(),
        })
        .select("id, atendente_id")
        .single();

      if (visitaInsertError) throw visitaInsertError;

      if (!novaVisita.atendente_id) {
        throw new Error("A visita foi criada sem atendente_id.");
      }

      await handleSearchVehicle(selectedVehicle.placa);
      await loadDashboardData();

      toast.success("Atendimento iniciado com sucesso.");
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      toast.error("Não foi possível iniciar o atendimento.");
    } finally {
      setStartingAttendance(false);
    }
  }

  return (
    <>
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

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#181818] text-yellow-200 shadow-sm transition active:scale-95"
            aria-label="Escanear QR Code"
          >
            <HiOutlineQrCode size={23} />
          </button>
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
              Busque motos por placa, acompanhe atendimentos em aberto e veja o
              histórico recente da operação em um só lugar.
            </p>
          </div>

          <div className="relative hidden xl:block">
            <button
              onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
            >
              <Settings size={20} />
            </button>

            {headerDropdownOpen && (
              <div className="absolute right-0 top-16 z-20 w-48 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
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

        <div className="mb-8">
          <Image
            src="/banner.png"
            alt="Banner MotoCheck"
            width={1250}
            height={160}
            className="w-full"
            style={{ height: "auto" }}
            priority
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

            <div className="w-full max-w-xl">
              <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 py-4">
                <HiOutlineMagnifyingGlass className="text-xl text-zinc-500" />

                <input
                  type="text"
                  value={plate}
                  onChange={(e) => {
                    setPlate(e.target.value.toUpperCase());
                    if (searchError) setSearchError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchVehicle();
                    }
                  }}
                  placeholder="Ex: QWE1A23"
                  className="w-full bg-transparent text-sm font-semibold uppercase text-[#181818] outline-none placeholder:text-zinc-400"
                />

                <button
                  onClick={() => handleSearchVehicle()}
                  disabled={searchingVehicle}
                  className="rounded-xl bg-[#181818] px-4 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {searchingVehicle ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {searchError ? (
                <p className="mt-3 text-sm font-bold text-red-600">
                  {searchError}
                </p>
              ) : null}
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

            <h3 className="mt-2 text-4xl font-black text-[#181818]">
              {loadingDashboard ? "..." : resumo.motos_cadastradas}
            </h3>

            <p className="mt-2 text-sm font-medium text-zinc-500">
              Total registrado no sistema
            </p>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
              <Zap size={20} />
            </div>

            <p className="text-sm font-bold text-zinc-500">Em andamento</p>

            <h3 className="mt-2 text-4xl font-black text-[#181818]">
              {loadingDashboard ? "..." : resumo.atendimentos_abertos}
            </h3>

            <p className="mt-2 text-sm font-medium text-zinc-500">
              Atendimentos abertos agora
            </p>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
              <FaCheckCircle size={20} />
            </div>

            <p className="text-sm font-bold text-zinc-500">Finalizadas hoje</p>

            <h3 className="mt-2 text-4xl font-black text-[#181818]">
              {loadingDashboard ? "..." : resumo.finalizadas_hoje}
            </h3>

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

            <h3 className="mt-2 text-4xl font-black text-[#181818]">
              {loadingDashboard
                ? "..."
                : formatTempoMedio(resumo.tempo_medio_permanencia_min)}
            </h3>

            <p className="mt-2 text-sm font-medium text-zinc-600">
              Média das visitas finalizadas
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
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>(
                    'input[placeholder="Ex: QWE1A23"]'
                  );
                  input?.focus();
                }}
                className="flex w-full items-center justify-between rounded-2xl bg-yellow-200 px-4 py-4 text-left text-sm font-extrabold text-[#181818] transition hover:opacity-95"
              >
                <span>Buscar moto por placa</span>
                <span>→</span>
              </button>

              <Link
                href="/dashboard/entradas-saidas"
                className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 px-4 py-4 text-left text-sm font-extrabold text-[#181818] transition hover:bg-zinc-200"
              >
                <span>Ver entradas e saídas</span>
                <span>→</span>
              </Link>

              <Link
                href="/dashboard/atendimentos"
                className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 px-4 py-4 text-left text-sm font-extrabold text-[#181818] transition hover:bg-zinc-200"
              >
                <span>Atendimentos</span>
                <span>→</span>
              </Link>
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

              <Link
                href="/dashboard/entradas-saidas"
                className="rounded-2xl bg-[#181818] px-4 py-3 text-center text-sm font-extrabold text-white"
              >
                Ver tudo
              </Link>
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-zinc-200 lg:block">
              <div className="grid grid-cols-5 bg-zinc-50 px-5 py-4 text-sm font-extrabold text-zinc-600">
                <span>Placa</span>
                <span>Cliente</span>
                <span>Moto</span>
                <span>Status</span>
                <span>Entrada</span>
              </div>

              {loadingDashboard ? (
                <div className="px-5 py-6 text-sm font-bold text-zinc-500">
                  Carregando atendimentos...
                </div>
              ) : atendimentos.length === 0 ? (
                <div className="px-5 py-6 text-sm font-bold text-zinc-500">
                  Nenhum atendimento registrado ainda.
                </div>
              ) : (
                atendimentos.map((item) => (
                  <Link
                    href={`/dashboard/atendimentos/${item.id}`}
                    key={item.id}
                    className="grid grid-cols-5 items-center border-t border-zinc-200 px-5 py-4 text-sm font-semibold text-[#181818] transition hover:bg-zinc-50"
                  >
                    <span className="font-black">{item.placa ?? "—"}</span>
                    <span>{item.cliente_nome ?? "—"}</span>
                    <span>{formatMoto(item)}</span>
                    <span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                          item.status
                        )}`}
                      >
                        {item.status_label ?? "Sem status"}
                      </span>
                    </span>
                    <span>{item.entrada_hora ?? "—"}</span>
                  </Link>
                ))
              )}
            </div>

            <div className="space-y-4 lg:hidden">
              {loadingDashboard ? (
                <div className="rounded-3xl border border-zinc-200 p-4 text-sm font-bold text-zinc-500">
                  Carregando atendimentos...
                </div>
              ) : atendimentos.length === 0 ? (
                <div className="rounded-3xl border border-zinc-200 p-4 text-sm font-bold text-zinc-500">
                  Nenhum atendimento registrado ainda.
                </div>
              ) : (
                atendimentos.map((item) => (
                  <Link
                    href={`/dashboard/atendimentos/${item.id}`}
                    key={item.id}
                    className="block rounded-3xl border border-zinc-200 p-4 transition hover:bg-zinc-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-[#181818]">
                          {item.placa ?? "—"}
                        </p>
                        <p className="text-sm font-medium text-zinc-500">
                          {formatMoto(item)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                          item.status
                        )}`}
                      >
                        {item.status_label ?? "Sem status"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-bold text-zinc-500">Cliente</p>
                        <p className="font-semibold text-[#181818]">
                          {item.cliente_nome ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-zinc-500">Entrada</p>
                        <p className="font-semibold text-[#181818]">
                          {item.entrada_hora ?? "—"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {scannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[30px] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Scanner MotoCheck
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#181818]">
                  Escaneie o QR Code
                </h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500">
                  Aponte a câmera para o QR Code exibido no computador para
                  continuar o checklist pelo celular.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
                aria-label="Fechar scanner"
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-black">
              <div
                ref={scannerRef}
                id="motocheck-qr-scanner"
                className="min-h-[280px] w-full"
              />
            </div>

            {scannerLoading ? (
              <p className="mt-4 text-center text-sm font-bold text-zinc-500">
                Abrindo câmera...
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => setScannerOpen(false)}
              className="mt-4 w-full rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <VehicleSearchModal
        open={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        vehicle={selectedVehicle}
        onCreateNew={() => {
          setVehicleModalOpen(false);
          setCreateVehicleModalOpen(true);
        }}
        onOpenHistory={() => {
          setVehicleModalOpen(false);
          toast("No próximo passo vamos abrir histórico/checklist.");
        }}
        onStartAttendance={handleStartAttendance}
        startingAttendance={startingAttendance}
      />

      {createVehicleModalOpen ? (
        <CreateVehicleModal
          open={createVehicleModalOpen}
          onClose={() => setCreateVehicleModalOpen(false)}
          initialPlate={selectedVehicle?.placa || plate}
          loading={creatingVehicle}
          onSubmit={async (formData) => {
            try {
              setCreatingVehicle(true);

              const { data: cliente, error: clienteError } = await supabase
                .from("clientes")
                .insert({
                  nome: formData.cliente,
                  telefone: formData.telefone || null,
                })
                .select("id")
                .single();

              if (clienteError) throw clienteError;

              const { error: motoError } = await supabase.from("motos").insert({
                placa: formData.placa,
                marca: formData.marca,
                modelo: formData.modelo,
                cilindrada: formData.cilindrada || null,
                ano: formData.ano ? Number(formData.ano) : null,
                cor: formData.cor || null,
                cliente_id: cliente.id,
              });

              if (motoError) throw motoError;

              setCreateVehicleModalOpen(false);
              setPlate(formData.placa);

              await handleSearchVehicle(formData.placa);
              await loadDashboardData();

              toast.success("Cadastro salvo com sucesso.");
            } catch (error) {
              console.error("Erro ao cadastrar veículo:", error);
              toast.error("Não foi possível salvar o cadastro.");
            } finally {
              setCreatingVehicle(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
