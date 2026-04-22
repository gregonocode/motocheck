import { FaCheckCircle, FaClipboardList, FaArrowRight } from "react-icons/fa";
import { CgSearchFound } from "react-icons/cg";

export default function MotoCheckLanding() {
  return (
    <section className="relative w-full overflow-hidden bg-zinc-50 px-6 py-20 md:px-10 lg:px-16">
      {/* Elemento de fundo (Blur/Glow) */}
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-yellow-400/20 blur-[100px]" />
      
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-16 lg:flex-row lg:items-center">
        
        {/* Lado esquerdo */}
        <div className="max-w-2xl text-center lg:text-left">
          
        

          <h1 className="text-5xl font-black tracking-tight text-zinc-900 sm:text-6xl lg:leading-[1.1]">
            Controle de entrada, checklist e saída da moto
            <span className="text-yellow-500"> em um só lugar.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 sm:text-xl lg:mx-0">
            O <strong className="font-extrabold text-zinc-900">MotoCheck</strong> ajuda sua
            oficina a localizar motos pela placa, registrar entrada com foto, preencher checklist
            e salvar o histórico completo de cada atendimento.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            {/* Alterado para tag <a> com link para /login */}
            <a 
              href="/login" 
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 text-base font-extrabold text-[#181818] shadow-lg shadow-yellow-400/20 transition-all hover:-translate-y-1 hover:bg-yellow-500 sm:w-auto"
            >
              Acessar / Fazer Login
              <FaArrowRight className="transition-transform group-hover:translate-x-1" />
            </a>

            <button className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white px-8 py-4 text-base font-bold text-zinc-700 transition-all hover:border-yellow-400 hover:bg-yellow-50 sm:w-auto">
              Falar com atendimento
            </button>
          </div>

          {/* Cards de Features */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-yellow-400 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-yellow-400 transition-colors group-hover:bg-yellow-400 group-hover:text-zinc-900">
                <CgSearchFound  size={20} />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">Busca rápida</h3>
              <p className="mt-2 text-sm text-zinc-500">Localize a moto na hora no balcão pela placa.</p>
            </div>

            <div className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-yellow-400 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-yellow-400">
                <FaClipboardList size={20} />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">Checklist</h3>
              <p className="mt-2 text-sm text-zinc-500">Itens organizados por categoria de forma simples.</p>
            </div>

            <div className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-yellow-400 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-yellow-400 transition-colors group-hover:bg-yellow-400 group-hover:text-zinc-900">
                <FaCheckCircle size={20} />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">Histórico</h3>
              <p className="mt-2 text-sm text-zinc-500">Fotos, observações e assinatura sempre salvas.</p>
            </div>
          </div>
        </div>

        {/* Lado direito (Mockup do App) */}
        <div className="w-full max-w-md lg:shrink-0">
          <div className="relative rounded-[32px] bg-zinc-900 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.2)] ring-1 ring-white/10">
            {/* Efeito de brilho sutil no card */}
            <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent opacity-50 mix-blend-overlay"></div>
            
            <div className="relative mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                  MotoCheck
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">Atendimento</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-900 shadow-inner">
                <CgSearchFound  size={24} />
              </div>
            </div>

            <div className="relative space-y-4">
              <div className="group rounded-2xl bg-white p-5 transition-transform hover:scale-[1.02]">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Placa
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xl font-black text-zinc-900">QWE1A23</p>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <FaCheckCircle size={12} />
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-800 p-5 ring-1 ring-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Status
                </p>
                <p className="mt-1 text-lg font-bold text-white">Moto já cadastrada</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-5 transition-transform hover:scale-[1.02]">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Entrada
                  </p>
                  <p className="mt-1 text-base font-black text-zinc-900">Com foto</p>
                </div>

                <div className="rounded-2xl bg-yellow-400 p-5 shadow-lg shadow-yellow-400/20 transition-transform hover:scale-[1.02]">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-900/60">
                    Checklist
                  </p>
                  <p className="mt-1 text-base font-black text-zinc-900">6 categorias</p>
                </div>
              </div>

              <div className="cursor-pointer rounded-2xl border border-dashed border-zinc-700 bg-zinc-800/50 p-5 text-center transition-colors hover:bg-zinc-800">
                <p className="text-sm font-bold text-zinc-400">
                  + Ver histórico completo
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}