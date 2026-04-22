"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";

import { CgSearchFound } from "react-icons/cg";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErro("Email ou senha inválidos.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Branding */}
        <section className="relative hidden overflow-hidden bg-yellow-400 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(24,24,24,0.12),transparent_28%)]" />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#181818] text-yellow-400 shadow-lg">
              <CgSearchFound size={28} />
            </div>

            <div className="max-w-xl">
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.25em] text-[#181818]/70">
                MotoCheck
              </p>

              <h1 className="text-5xl font-black leading-[1.02] text-[#181818] xl:text-6xl">
                Controle sua oficina com mais rapidez e organização.
              </h1>

              <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-[#181818]/80">
                Busque por placa, registre entrada com foto, preencha checklist,
                salve a assinatura do cliente e acompanhe todo o histórico da moto.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-extrabold text-[#181818]">
                  Entrada com foto
                </span>
                <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-extrabold text-[#181818]">
                  Checklist completo
                </span>
                <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-extrabold text-[#181818]">
                  Histórico por placa
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white/75 p-5 backdrop-blur">
              <p className="text-sm font-bold text-[#181818]/70">
                Simples para o balcão, rápido para o atendimento e organizado para a oficina.
              </p>
            </div>
          </div>
        </section>

        {/* Login */}
        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#181818] text-yellow-400">
                <CgSearchFound size={24} />
              </div>
              <h1 className="text-3xl font-black text-[#181818]">
                Entrar no MotoCheck
              </h1>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Acesse sua conta para continuar.
              </p>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-8">
              <div className="mb-8 hidden lg:block">
                <h2 className="text-4xl font-black text-[#181818]">Login</h2>
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  Entre com seu email e senha para acessar a dashboard.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-extrabold text-[#181818]"
                  >
                    Email
                  </label>

                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 transition focus-within:border-yellow-400">
                    <HiOutlineMail className="text-xl text-zinc-500" />
                    <input
                      id="email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent text-[15px] font-medium text-[#181818] outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-extrabold text-[#181818]"
                  >
                    Senha
                  </label>

                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 transition focus-within:border-yellow-400">
                    <HiOutlineLockClosed className="text-xl text-zinc-500" />
                    <input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent text-[15px] font-medium text-[#181818] outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                {erro ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    {erro}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#181818] px-5 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}