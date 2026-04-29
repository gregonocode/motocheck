"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineCamera,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistQuestionItem } from "./checklistQuestions";

type ChecklistQuizProps = {
  visitaId: string;
  questions: ChecklistQuestionItem[];
  tipoChecklist?: "entrada" | "saida";
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

type CanvasPoint = {
  x: number;
  y: number;
};

const PHOTO_QUESTION_ID = "f2222222-2222-2222-2222-222222222222";

const brushColors = [
  { label: "Vermelho", value: "#ef4444" },
  { label: "Amarelo", value: "#facc15" },
  { label: "Verde", value: "#22c55e" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Preto", value: "#181818" },
];

export default function ChecklistQuiz({
  visitaId,
  questions,
  tipoChecklist = "entrada",
}: ChecklistQuizProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastPointRef = useRef<CanvasPoint | null>(null);

  const [atendimento, setAtendimento] = useState<AtendimentoData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [textareaValue, setTextareaValue] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState("#ef4444");
  const [isDrawing, setIsDrawing] = useState(false);

  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isPhotoStep = currentQuestion?.id === PHOTO_QUESTION_ID;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  function formatStatus(status?: string | null) {
    if (status === "aberta" || status === "em_andamento") return "Em andamento";
    if (status === "aguardando") return "Aguardando";
    if (status === "finalizada") return "Finalizada";
    if (status === "cancelada") return "Cancelada";
    return "Sem atendimento";
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
        toast.error("Atendimento não encontrado.");
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
        .eq("tipo_checklist", tipoChecklist);

      if (checklistError) throw checklistError;

      const answerMap: Record<string, string> = {};

      checklistRows?.forEach((row: ChecklistRow) => {
        answerMap[row.item_modelo_id] = row.valor_texto ?? row.status ?? "";
      });

      setAnswers(answerMap);
      setTextareaValue(answerMap[questions[0]?.id] ?? "");
    } catch (error) {
      console.error("Erro ao carregar quiz:", error);
      toast.error("Não foi possível carregar o quiz.");
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    if (visitaId) {
      void Promise.resolve().then(() => loadVisitaData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitaId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setTextareaValue(answers[currentQuestion?.id] ?? "");
    });
  }, [currentQuestion?.id, answers]);

  useEffect(() => {
    if (photoDataUrl) {
      drawImageOnCanvas(photoDataUrl);
    }
  }, [photoDataUrl]);

  function drawImageOnCanvas(dataUrl: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new window.Image();

    image.onload = () => {
      const maxWidth = 1200;
      const ratio =
        image.naturalWidth > maxWidth ? maxWidth / image.naturalWidth : 1;

      canvas.width = Math.round(image.naturalWidth * ratio);
      canvas.height = Math.round(image.naturalHeight * ratio);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };

    image.src = dataUrl;
  }

  function getCanvasPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function drawLine(from: CanvasPoint, to: CanvasPoint) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!photoDataUrl) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    const point = getCanvasPoint(event);

    if (!canvas || !point) return;

    canvas.setPointerCapture(event.pointerId);
    lastPointRef.current = point;
    setIsDrawing(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !photoDataUrl) return;

    event.preventDefault();

    const point = getCanvasPoint(event);
    const lastPoint = lastPointRef.current;

    if (!point || !lastPoint) return;

    drawLine(lastPoint, point);
    lastPointRef.current = point;
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (canvas && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    lastPointRef.current = null;
    setIsDrawing(false);
  }

  function handlePhotoFile(file?: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        setPhotoDataUrl(result);
      }
    };

    reader.readAsDataURL(file);
  }

  function clearDrawings() {
    if (!photoDataUrl) return;
    drawImageOnCanvas(photoDataUrl);
  }

  function canvasToBlob() {
    return new Promise<Blob>((resolve, reject) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        reject(new Error("Canvas não encontrado."));
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Não foi possível gerar a imagem."));
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.88
      );
    });
  }

  async function uploadPhotoAndGetUrl() {
    const blob = await canvasToBlob();

    const path = `visitas/${visitaId}/${tipoChecklist}-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from("fotos")
      .upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("fotos")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async function saveAnswers(nextAnswers: Record<string, string>) {
    const payload = questions
      .filter((question) => {
        const value = nextAnswers[question.id];
        return typeof value === "string" && value.trim().length > 0;
      })
      .map((question, index) => {
        const value = nextAnswers[question.id];
        const isTextarea = question.type === "textarea";

        return {
          visita_id: visitaId,
          categoria_id: question.categoriaId,
          item_modelo_id: question.id,
          tipo_checklist: tipoChecklist,
          ordem: index + 1,
          status: ["ok", "atencao", "nao_funciona", "trocar"].includes(value)
            ? value
            : "ok",
          valor_texto: value,
          observacao: isTextarea ? value : null,
        };
      });

    const { error: deleteError } = await supabase
      .from("visita_checklist_itens")
      .delete()
      .eq("visita_id", visitaId)
      .eq("tipo_checklist", tipoChecklist);

    if (deleteError) throw deleteError;

    if (payload.length > 0) {
      const { error: insertError } = await supabase
        .from("visita_checklist_itens")
        .insert(payload);

      if (insertError) throw insertError;
    }
  }

  async function finishQuiz(nextAnswers: Record<string, string>) {
    try {
      setSaving(true);
      await saveAnswers(nextAnswers);

      const { error: visitaUpdateError } = await supabase
        .from("visitas")
        .update({
          status: "aguardando",
          updated_at: new Date().toISOString(),
        })
        .eq("id", visitaId);

      if (visitaUpdateError) throw visitaUpdateError;

      toast.success("Checklist salvo com sucesso.");
      router.push(`/dashboard/entradas-saidas/${visitaId}`);
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      toast.error("Não foi possível salvar o checklist.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOptionAnswer(value: string) {
    if (!currentQuestion || saving) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };

    setAnswers(nextAnswers);

    if (isLastStep) {
      await finishQuiz(nextAnswers);
      return;
    }

    window.setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 180);
  }

  async function handleTextareaNext() {
    if (!currentQuestion || saving) return;

    const value = textareaValue.trim();

    if (!value) {
      toast.error("Digite uma observação para continuar.");
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };

    setAnswers(nextAnswers);

    if (isLastStep) {
      await finishQuiz(nextAnswers);
      return;
    }

    setCurrentStep((prev) => prev + 1);
  }

  async function handleSavePhotoAndFinish() {
    if (!currentQuestion || saving) return;

    if (!photoDataUrl) {
      toast.error("Tire uma foto para continuar.");
      return;
    }

    try {
      setSaving(true);

      const photoUrl = await uploadPhotoAndGetUrl();

      const photoColumn =
        tipoChecklist === "entrada" ? "foto_entrada_url" : "foto_saida_url";

      const { error: visitaPhotoError } = await supabase
        .from("visitas")
        .update({
          [photoColumn]: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", visitaId);

      if (visitaPhotoError) throw visitaPhotoError;

      const nextAnswers = {
        ...answers,
        [currentQuestion.id]: "foto_ok",
      };

      setAnswers(nextAnswers);

      await finishQuiz(nextAnswers);
    } catch (error) {
      console.error("Erro ao salvar foto:", error);
      toast.error("Não foi possível salvar a foto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkipPhotoAndFinish() {
    if (!currentQuestion || saving) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: "foto_depois",
    };

    setAnswers(nextAnswers);
    await finishQuiz(nextAnswers);
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return;
    }

    router.push(`/dashboard/atendimentos/${visitaId}`);
  }

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] px-4 py-6">
        <div className="mx-auto max-w-xl rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-black text-[#181818]">
            Carregando quiz...
          </p>
        </div>
      </div>
    );
  }

  if (!atendimento || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] px-4 py-6">
        <div className="mx-auto max-w-xl rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-black text-[#181818]">
            Atendimento não encontrado.
          </p>

          <Link
            href="/dashboard/atendimentos"
            className="mt-4 inline-flex rounded-2xl bg-[#181818] px-5 py-3 text-sm font-extrabold text-white"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const selectedValue = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-xl flex-col">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-[#181818] shadow-sm"
          >
            <HiOutlineArrowLeft size={20} />
          </button>

          <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500 shadow-sm">
            Moto Check
          </div>

          <div className="h-11 w-11" />
        </div>

        <div className="mb-5 rounded-[30px] bg-[#181818] p-5 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            Quiz Moto Check
          </p>

          <h1 className="mt-2 text-2xl font-black leading-tight">
            {atendimento.placa}
          </h1>

          <p className="mt-1 text-sm font-semibold text-white/70">
            {atendimento.moto} • {atendimento.cliente}
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-white/70">
              <span>
                Etapa {currentStep + 1} de {totalSteps}
              </span>
              <span>{progress}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-yellow-200 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <main className="flex flex-1 flex-col rounded-[34px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Pergunta atual
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-[#181818]">
              {isPhotoStep ? "Tire uma foto da moto" : currentQuestion.title}
            </h2>

            {currentQuestion.description ? (
              <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-500">
                {isPhotoStep
                  ? "Use a câmera do celular, marque pontos importantes na imagem e salve a foto do atendimento."
                  : currentQuestion.description}
              </p>
            ) : null}
          </div>

          {isPhotoStep ? (
            <div className="flex flex-1 flex-col">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => handlePhotoFile(event.target.files?.[0])}
              />

              {!photoDataUrl ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-zinc-300 bg-[#FAFAFA] px-5 py-8 text-center transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#181818] text-yellow-200">
                    <HiOutlineCamera size={30} />
                  </div>

                  <p className="text-xl font-black text-[#181818]">
                    Tirar foto
                  </p>

                  <p className="mt-2 max-w-xs text-sm font-semibold text-zinc-500">
                    Toque para abrir a câmera do celular e fotografar a moto na
                    entrada.
                  </p>
                </button>
              ) : (
                <div>
                  <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-100">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="block w-full touch-none"
                    />
                  </div>

                  <div className="mt-4 rounded-[24px] border border-zinc-200 bg-[#FAFAFA] p-4">
                    <p className="mb-3 text-sm font-black text-[#181818]">
                      Cor da marcação
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {brushColors.map((color) => {
                        const active = brushColor === color.value;

                        return (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setBrushColor(color.value)}
                            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black transition ${
                              active
                                ? "border-[#181818] bg-white text-[#181818]"
                                : "border-zinc-200 bg-white text-zinc-500"
                            }`}
                          >
                            <span
                              className="h-5 w-5 rounded-full border border-black/10"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black text-[#181818] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Trocar foto
                      </button>

                      <button
                        type="button"
                        onClick={clearDrawings}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-black text-[#181818] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <HiOutlineTrash size={17} />
                        Limpar riscos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  disabled={saving || !photoDataUrl}
                  onClick={handleSavePhotoAndFinish}
                  className="rounded-[22px] bg-[#181818] px-5 py-4 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Salvando foto..." : "Salvar foto e finalizar"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSkipPhotoAndFinish}
                  className="rounded-[22px] border border-zinc-300 px-5 py-4 text-sm font-black text-[#181818] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Adicionar foto depois
                </button>
              </div>
            </div>
          ) : currentQuestion.type === "options" ? (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => {
                const selected = selectedValue === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={saving}
                    onClick={() => handleOptionAnswer(option.value)}
                    className={`flex w-full items-center justify-between rounded-[24px] border px-5 py-5 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                      selected
                        ? "border-[#181818] bg-[#181818] text-white"
                        : "border-zinc-200 bg-[#FAFAFA] text-[#181818] hover:border-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="text-lg font-black">{option.label}</p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          selected ? "text-white/70" : "text-zinc-500"
                        }`}
                      >
                        Tocar para responder
                      </p>
                    </div>

                    {selected ? (
                      <HiOutlineCheckCircle className="shrink-0" size={24} />
                    ) : (
                      <span className="h-6 w-6 shrink-0 rounded-full border border-zinc-300 bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <textarea
                value={textareaValue}
                onChange={(event) => setTextareaValue(event.target.value)}
                placeholder={currentQuestion.placeholder || "Digite aqui..."}
                className="min-h-[220px] w-full flex-1 rounded-[24px] border border-zinc-300 bg-[#FAFAFA] px-5 py-4 text-base font-semibold text-[#181818] outline-none placeholder:text-zinc-400 focus:border-yellow-300 focus:bg-white"
              />

              <button
                type="button"
                disabled={saving}
                onClick={handleTextareaNext}
                className="mt-4 rounded-[22px] bg-[#181818] px-5 py-4 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLastStep ? "Finalizar checklist" : "Continuar"}
              </button>
            </div>
          )}

          {saving ? (
            <p className="mt-5 text-center text-sm font-bold text-zinc-500">
              Salvando atendimento...
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
