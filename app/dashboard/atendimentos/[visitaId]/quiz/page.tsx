import ChecklistQuiz from "@/app/componets/atendimentos/ChecklistQuiz";

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
      tipoChecklist="entrada"
    />
  );
}
