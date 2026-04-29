export type ChecklistQuestionItem = {
  id: string;
  categoriaId: string;
  title: string;
  description?: string;
  type: "options" | "textarea";
  options?: { label: string; value: string }[];
  placeholder?: string;
};

export const checklistEntradaQuestions: ChecklistQuestionItem[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    categoriaId: "11111111-1111-1111-1111-111111111111",
    title: "Como está o nível de combustível?",
    description: "Marque o nível informado no momento da entrada da moto.",
    type: "options",
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
    options: [
      { label: "Foto adicionada", value: "foto_ok" },
      { label: "Adicionar depois", value: "foto_depois" },
    ],
  },
];