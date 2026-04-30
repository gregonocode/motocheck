"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

type PerfilUsuario = {
  nome: string;
  email: string;
};

export default function PerfilPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [perfil, setPerfil] = useState<PerfilUsuario>({
    nome: "Usuario",
    email: "email nao informado",
  });
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPerfil() {
      try {
        setLoadingPerfil(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("nome, email")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (usuarioError) throw usuarioError;

        if (!cancelled) {
          setPerfil({
            nome:
              usuario?.nome ??
              user.user_metadata?.nome ??
              user.user_metadata?.name ??
              user.email?.split("@")[0] ??
              "Usuario",
            email: usuario?.email ?? user.email ?? "email nao informado",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Nao foi possivel carregar seu perfil.");
      } finally {
        if (!cancelled) setLoadingPerfil(false);
      }
    }

    void loadPerfil();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast.success("Voce saiu da conta.");
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
      toast.error("Nao foi possivel sair da conta.");
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Perfil
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
            Minha conta
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-zinc-600 sm:text-base">
            Confira os dados basicos do usuario conectado ao MotoCheck.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-[#181818] text-yellow-200">
                <HiOutlineUserCircle size={42} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-500">
                  Usuario conectado
                </p>
                <h2 className="mt-1 break-words text-3xl font-black text-[#181818]">
                  {loadingPerfil ? "Carregando..." : perfil.nome}
                </h2>
                <p className="mt-2 break-words text-sm font-semibold text-zinc-500">
                  {loadingPerfil ? "Buscando dados da conta" : perfil.email}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                  <HiOutlineEnvelope size={22} />
                </div>
                <p className="text-sm font-bold text-zinc-500">E-mail</p>
                <p className="mt-1 break-words text-base font-black text-[#181818]">
                  {loadingPerfil ? "..." : perfil.email}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
                  <HiOutlineShieldCheck size={22} />
                </div>
                <p className="text-sm font-bold text-zinc-500">Status</p>
                <p className="mt-1 text-base font-black text-[#181818]">
                  Conta ativa
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-black text-[#181818]">Sessao</h2>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                Encerre o acesso neste dispositivo quando terminar o uso.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#181818] px-5 py-4 text-sm font-extrabold text-white transition hover:opacity-95"
            >
              <HiOutlineArrowRightOnRectangle size={20} />
              Deslogar
            </button>
          </aside>
        </div>
      </div>

      {logoutModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[30px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Confirmar saida
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#181818]">
                  Deseja deslogar?
                </h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500">
                  Voce sera redirecionado para a tela de login.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
                aria-label="Fechar confirmacao"
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                disabled={loggingOut}
                className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-2xl bg-[#181818] px-5 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loggingOut ? "Saindo..." : "Sim, deslogar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
