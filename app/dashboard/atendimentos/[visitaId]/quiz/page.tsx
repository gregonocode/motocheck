import ChecklistQuiz from "@/app/componets/atendimentos/ChecklistQuiz";
import { checklistEntradaQuestions } from "@/app/componets/atendimentos/checklistQuestions";

type PageProps = {
  params: Promise<{
    visitaId: string;
  }>;
};

export default async function AtendimentoQuizPage({ params }: PageProps) {
  const { visitaId } = await params;

  return (
    <ChecklistQuiz
      visitaId={visitaId}
      questions={checklistEntradaQuestions}
      tipoChecklist="entrada"
    />
  );
}
