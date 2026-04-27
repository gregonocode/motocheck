"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCamera,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { FaMotorcycle, FaGasPump } from "react-icons/fa";
import { PiEngineFill } from "react-icons/pi";
import { MdOutlineElectricalServices } from "react-icons/md";

type QuizAnswerValue = string;

type QuestionItem = {
  id: string;
  categoriaId: string;
  title: string;
  description?: string;
  type: "options" | "textarea";
  icon?: React.ReactNode;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

type AtendimentoData = {
  id: string;
  placa: string;
  cliente: string;
  moto: string;
  status: string;
  entrada: string;
};

type ChecklistRow = {
  item_modelo_id: string;
  status: string | null;
  valor_texto: string | null;
};

export default function AtendimentoDetalhePage() {
  const params = useParams();
  const visitaId = params?.visitaId as string;
  const supabase = createClient();

  const questions = useMemo<QuestionItem[]>(
    () => [
      {
        id: "a1111111-1111-1111-1111-111111111111",
        categoriaId: "11111111-1111-1111-1111-111111111111",
        title: "Como está o nível de combustível?",
        description: "Marque o nível informado no momento da entrada da moto.",
        type: "options",
        icon: <FaGasPump size={20} />,
        options: [
          { label: "Baixo", value: "baixo" },
          { label: "Médio", value: "medio" },
          { label: "Cheio", value: "cheio" },
        ],
      },
      {
        id: "b1111111-1111-1111-1111-111111111111",
        categoriaId: "22222222-2222-2222-2222-222222222222",
        title: "Pisca esquerdo",
        description: "Confira o funcionamento do pisca esquerdo.",
        type: "options",
        icon: <MdOutlineElectricalServices size={22} />,
        options: [
          { label: "OK", value: "ok" },
          { label: "Atenção", value: "atencao" },
          { label: "Não funciona", value: "nao_funciona" },
        ],
      },
      {
        id: "b2222222-2222-2222-2222-222222222222",
        categoriaId: "22222222-2222-2222-2222-222222222222",
        title: "Pisca direito",
        description: "Confira o funcionamento do pisca direito.",
        type: "options",
        icon: <MdOutlineElectricalServices size={22} />,
        options: [
          { label: "OK", value: "ok" },
          { label: "Atenção", value: "atencao" },
          { label: "Não funciona", value: "nao_funciona" },
        ],
      },
      {
        id: "b3333333-3333-3333-3333-333333333333",
        categoriaId: "22222222-2222-2222-2222-222222222222",
        title: "Farol",
        description: "Confira o funcionamento do farol.",
        type: "options",
        icon: <MdOutlineElectricalServices size={22} />,
        options: [
          { label: "OK", value: "ok" },
          { label: "Atenção", value: "atencao" },
          { label: "Não funciona", value: "nao_funciona" },
        ],
      },
      {
        id: "b4444444-4444-4444-4444-444444444444",
        categoriaId: "22222222-2222-2222-2222-222222222222",
        title: "Buzina",
        description: "Confira o funcionamento da buzina.",
        type: "options",
        icon: <MdOutlineElectricalServices size={22} />,
        options: [
          { label: "OK", value: "ok" },
          { label: "Atenção", value: "atencao" },
          { label: "Não funciona", value: "nao_funciona" },
        ],
      },
      {
        id: "c2222222-2222-2222-2222-222222222222",
        categoriaId: "33333333-3333-3333-3333-333333333333",
        title: "Caximbo de vela",
        description: "Verifique o estado do caximbo de vela.",
        type: "options",
        icon: <PiEngineFill size={22} />,
        options: [
          { label: "OK", value: "ok" },
          { label: "Atenção", value: "atencao" },
          { label: "Trocar", value: "trocar" },
        ],
      },
      {
        id: "f1111111-1111-1111-1111-111111111111",
        categoriaId: "66666666-6666-6666-6666-666666666666",
        title: "Observações da entrada",
        description:
          "Descreva avarias, riscos, detalhes visuais ou qualquer observação importante.",
        type: "textarea",
        icon: <FaMotorcycle size={18} />,
        placeholder:
          "Ex: carenagem arranhada no lado esquerdo, retrovisor solto, banco com pequeno rasgo...",
      },
      {
        id: "f2222222-2222-2222-2222-222222222222",
        categoriaId: "77777777-7777-7777-7777-777777777777",
        title: "Foto da entrada",
        description:
          "Marque se a foto da entrada já foi feita. No próximo passo vamos ligar isso com upload real.",
        type: "options",
        icon: <HiOutlineCamera size={22} />,
        options: [
          { label: "Foto adicionada", value: "foto_ok" },
          { label: "Adicionar depois", value: "foto_depois" },
        ],
      },
    ],
    []
  );

  const [atendimento, setAtendimento] = useState<AtendimentoData | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingPage, setLoadingPage] = useState(true);
  const [savingPartial, setSavingPartial] = useState(false);

  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  function formatStatus(status?: string) {
    if (status === "aberta" || status === "em_andamento") return "Em andamento";
    if (status === "finalizada") return "Finalizada";
    if (status === "cancelada") return "Aguardando";
    return "Sem atendimento";
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function canGoNext() {
    const value = answers[currentQuestion.id];
    return typeof value === "string" && value.trim().length > 0;
  }

  async function loadVisitaData() {
    try {
      setLoadingPage(true);

      const { data: visita, error: visitaError } = await supabase
        .from("visitas")
        .select("id, status, data_entrada, moto_id, cliente_id")
        .eq("id", visitaId)
        .maybeSingle();

      if (visitaError) throw visitaError;
      if (!visita) {
        alert("Atendimento não encontrado.");
        return;
      }

      const { data: moto, error: motoError } = await supabase
        .from("motos")
        .select("id, placa, modelo")
        .eq("id", visita.moto_id)
        .maybeSingle();

      if (motoError) throw motoError;

      let clienteNome = "Não informado";

      if (visita.cliente_id) {
        const { data: cliente, error: clienteError } = await supabase
          .from("clientes")
          .select("nome")
          .eq("id", visita.cliente_id)
          .maybeSingle();

        if (clienteError) throw clienteError;
        clienteNome = cliente?.nome ?? "Não informado";
      }

      setAtendimento({
        id: visita.id,
        placa: moto?.placa ?? "—",
        cliente: clienteNome,
        moto: moto?.modelo ?? "—",
        status: formatStatus(visita.status),
        entrada: visita.data_entrada
          ? new Date(visita.data_entrada).toLocaleString("pt-BR")
          : "—",
      });

      const { data: checklistRows, error: checklistError } = await supabase
        .from("visita_checklist_itens")
        .select("item_modelo_id, status, valor_texto")
        .eq("visita_id", visitaId)
        .eq("tipo_checklist", "entrada");

      if (checklistError) throw checklistError;

      const answerMap: Record<string, string> = {};

      checklistRows?.forEach((row: ChecklistRow) => {
        answerMap[row.item_modelo_id] = row.valor_texto ?? row.status ?? "";
      });

      setAnswers(answerMap);
    } catch (error) {
      console.error("Erro ao carregar atendimento:", error);
      alert("Não foi possível carregar o atendimento.");
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (visitaId) {
        void loadVisitaData();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitaId]);

  async function handleSavePartial() {
    try {
      setSavingPartial(true);

      const payload = questions
        .filter((question) => {
          const value = answers[question.id];
          return typeof value === "string" && value.trim().length > 0;
        })
        .map((question, index) => {
          const value = answers[question.id];
          const isTextarea = question.type === "textarea";

          return {
            visita_id: visitaId,
            categoria_id: question.categoriaId,
            item_modelo_id: question.id,
            tipo_checklist: "entrada",
            ordem: index + 1,
            status: isTextarea ? "ok" : value,
            valor_texto: isTextarea ? value : null,
            observacao: isTextarea ? value : null,
          };
        });

      const { error: deleteError } = await supabase
        .from("visita_checklist_itens")
        .delete()
        .eq("visita_id", visitaId)
        .eq("tipo_checklist", "entrada");

      if (deleteError) throw deleteError;

      if (payload.length > 0) {
        const { error: insertError } = await supabase
          .from("visita_checklist_itens")
          .insert(payload);

        if (insertError) throw insertError;
      }

      alert("Checklist salvo com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      alert("Não foi possível salvar o checklist.");
    } finally {
      setSavingPartial(false);
    }
  }

  async function handleNext() {
    if (!canGoNext()) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    await handleSavePartial();
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  if (loadingPage) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-lg font-black text-[#181818]">
            Carregando atendimento...
          </p>
        </div>
      </div>
    );
  }

  if (!atendimento) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-lg font-black text-[#181818]">
            Atendimento não encontrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3">
            <Link
              href="/dashboard/atendimentos"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50"
            >
              <HiOutlineArrowLeft size={18} />
              Voltar para atendimentos
            </Link>
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Atendimento #{atendimento.id}
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
            Checklist de entrada da moto
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-medium text-zinc-600 sm:text-base">
            Siga o fluxo abaixo para registrar como a moto chegou e salvar o
            checklist no sistema.
          </p>
        </div>

        <div className="min-w-[280px] rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
            Dados da visita
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Placa:</span> {atendimento.placa}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Cliente:</span> {atendimento.cliente}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Moto:</span> {atendimento.moto}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Status:</span> {atendimento.status}
            </p>
            <p className="font-semibold text-[#181818]">
              <span className="font-black">Entrada:</span> {atendimento.entrada}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-[#181818]">
              Etapa {currentStep + 1} de {totalSteps}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Progresso do checklist de entrada
            </p>
          </div>

          <div className="rounded-2xl bg-yellow-100 px-4 py-2 text-sm font-extrabold text-[#181818]">
            {progress}%
          </div>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-[#181818] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-lg font-black text-[#181818]">Etapas</p>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Acompanhe o andamento do preenchimento.
          </p>

          <div className="mt-5 space-y-3">
            {questions.map((question, index) => {
              const answered = !!answers[question.id];
              const active = index === currentStep;

              return (
                <div
                  key={question.id}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    active
                      ? "border-yellow-200 bg-yellow-50"
                      : answered
                      ? "border-green-200 bg-green-50"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                        active
                          ? "bg-[#181818] text-white"
                          : answered
                          ? "bg-green-100 text-green-700"
                          : "border border-zinc-200 bg-white text-zinc-500"
                      }`}
                    >
                      {answered && !active ? (
                        <HiOutlineCheckCircle size={18} />
                      ) : (
                        <span className="text-xs font-black">{index + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#181818]">
                        {question.title}
                      </p>
                      <p className="mt-1 text-xs font-medium text-zinc-500">
                        {answered
                          ? "Respondido"
                          : active
                          ? "Etapa atual"
                          : "Pendente"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-[#181818]">
              {currentQuestion.icon ?? <FaMotorcycle size={20} />}
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">
                Pergunta atual
              </p>
              <h2 className="text-2xl font-black text-[#181818] sm:text-3xl">
                {currentQuestion.title}
              </h2>
            </div>
          </div>

          {currentQuestion.description ? (
            <p className="mb-8 max-w-3xl text-base font-medium leading-relaxed text-zinc-600">
              {currentQuestion.description}
            </p>
          ) : null}

          {currentQuestion.type === "options" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {currentQuestion.options?.map((option) => {
                const selected = answers[currentQuestion.id] === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAnswer(currentQuestion.id, option.value)}
                    className={`rounded-[24px] border px-5 py-6 text-left transition ${
                      selected
                        ? "border-[#181818] bg-[#181818] text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
                        : "border-zinc-200 bg-[#fafafa] text-[#181818] hover:border-zinc-300 hover:bg-white"
                    }`}
                  >
                    <p className="text-lg font-black">{option.label}</p>
                    <p
                      className={`mt-2 text-sm font-medium ${
                        selected ? "text-white/80" : "text-zinc-500"
                      }`}
                    >
                      Toque para selecionar esta opção.
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.placeholder || "Digite aqui..."}
                className="min-h-[180px] w-full rounded-[24px] border border-zinc-300 bg-[#fafafa] px-5 py-4 text-sm font-medium text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300 focus:bg-white"
              />
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HiOutlineArrowLeft size={18} />
              Voltar
            </button>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSavePartial}
                disabled={savingPartial}
                className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-extrabold text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPartial ? "Salvando..." : "Salvar parcial"}
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext() || savingPartial}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {currentStep === totalSteps - 1 ? "Concluir etapa" : "Próxima"}
                <HiOutlineArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
