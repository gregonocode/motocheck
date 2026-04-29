import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

type ChecklistItem = {
  id: string;
  item_modelo_id: string | null;
  status: string | null;
  valor_texto: string | null;
  observacao: string | null;
  ordem: number | null;
};

const requiredChecklistItemIds = [
  "a1111111-1111-1111-1111-111111111111",
  "b1111111-1111-1111-1111-111111111111",
  "b2222222-2222-2222-2222-222222222222",
  "b3333333-3333-3333-3333-333333333333",
  "b4444444-4444-4444-4444-444444444444",
  "c2222222-2222-2222-2222-222222222222",
  "f1111111-1111-1111-1111-111111111111",
  "f2222222-2222-2222-2222-222222222222",
];

const questionLabels: Record<string, string> = {
  "a1111111-1111-1111-1111-111111111111": "Nivel de combustivel",
  "b1111111-1111-1111-1111-111111111111": "Pisca esquerdo",
  "b2222222-2222-2222-2222-222222222222": "Pisca direito",
  "b3333333-3333-3333-3333-333333333333": "Farol",
  "b4444444-4444-4444-4444-444444444444": "Buzina",
  "c2222222-2222-2222-2222-222222222222": "Caximbo de vela",
  "f1111111-1111-1111-1111-111111111111": "Observacoes da entrada",
  "f2222222-2222-2222-2222-222222222222": "Foto da entrada",
};

const valueLabels: Record<string, string> = {
  baixo: "Baixo",
  medio: "Medio",
  cheio: "Cheio",
  ok: "OK",
  atencao: "Atencao",
  nao_funciona: "Nao funciona",
  trocar: "Trocar",
  foto_ok: "Foto adicionada",
  foto_depois: "Adicionar depois",
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Configuracao ausente: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

function sanitizeText(value?: string | number | null) {
  return String(value ?? "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getChecklistAnswer(item: ChecklistItem) {
  const value = item.valor_texto || item.status || "-";
  return valueLabels[value] ?? value;
}

function getQuestionTitle(item: ChecklistItem) {
  if (item.item_modelo_id && questionLabels[item.item_modelo_id]) {
    return questionLabels[item.item_modelo_id];
  }

  return "Item do checklist";
}

function wrapText(text: string, maxChars: number) {
  const words = sanitizeText(text).split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);

  return lines;
}

async function fetchImageBytes(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar a imagem da visita.");
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function embedImage(pdfDoc: PDFDocument, bytes: Uint8Array, urlOrName = "") {
  const lower = urlOrName.toLowerCase();

  if (lower.endsWith(".png")) {
    return pdfDoc.embedPng(bytes);
  }

  try {
    return await pdfDoc.embedJpg(bytes);
  } catch {
    return pdfDoc.embedPng(bytes);
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: visita, error: visitaError } = await supabase
      .from("visitas")
      .select(
        "id, moto_id, cliente_id, status, km, nivel_combustivel, foto_entrada_url, observacoes_entrada, data_entrada, data_saida, tempo_permanencia_min"
      )
      .eq("id", id)
      .maybeSingle();

    if (visitaError) throw visitaError;

    if (!visita) {
      return NextResponse.json(
        { error: "Visita nao encontrada." },
        { status: 404 }
      );
    }

    if (visita.status === "aberta" || visita.status === "em_andamento") {
      return NextResponse.json(
        {
          error:
            "O PDF so pode ser gerado apos a conclusao do checklist de entrada.",
        },
        { status: 400 }
      );
    }

    const { data: checklistData, error: checklistError } = await supabase
      .from("visita_checklist_itens")
      .select("id, item_modelo_id, status, valor_texto, observacao, ordem")
      .eq("visita_id", id)
      .eq("tipo_checklist", "entrada")
      .order("ordem", { ascending: true });

    if (checklistError) throw checklistError;

    const checklist = (checklistData ?? []) as ChecklistItem[];

    const checklistCompleto = requiredChecklistItemIds.every((itemId) =>
      checklist.some((item) => {
        const value = item.valor_texto || item.status;
        return item.item_modelo_id === itemId && !!value;
      })
    );

    if (!checklistCompleto) {
      return NextResponse.json(
        {
          error:
            "Checklist incompleto. Responda todos os itens antes de gerar o PDF.",
        },
        { status: 400 }
      );
    }

    const { data: moto, error: motoError } = visita.moto_id
      ? await supabase
          .from("motos")
          .select("id, placa, marca, modelo, cilindrada, ano, cor")
          .eq("id", visita.moto_id)
          .maybeSingle()
      : { data: null, error: null };

    if (motoError) throw motoError;

    const { data: cliente, error: clienteError } = visita.cliente_id
      ? await supabase
          .from("clientes")
          .select("id, nome, telefone")
          .eq("id", visita.cliente_id)
          .maybeSingle()
      : { data: null, error: null };

    if (clienteError) throw clienteError;

    const pdfDoc = await PDFDocument.create();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 42;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    function addPage() {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    function ensureSpace(height: number) {
      if (y - height < margin) {
        addPage();
      }
    }

    function drawText(
      text: string,
      x: number,
      currentY: number,
      options?: {
        size?: number;
        bold?: boolean;
        color?: ReturnType<typeof rgb>;
      }
    ) {
      page.drawText(sanitizeText(text), {
        x,
        y: currentY,
        size: options?.size ?? 10,
        font: options?.bold ? fontBold : fontRegular,
        color: options?.color ?? rgb(0.1, 0.1, 0.1),
      });
    }

    function drawWrappedText(
      text: string,
      x: number,
      maxChars: number,
      size = 10,
      lineHeight = 14
    ) {
      const lines = wrapText(text, maxChars);

      for (const line of lines) {
        ensureSpace(lineHeight);
        drawText(line, x, y, { size });
        y -= lineHeight;
      }
    }

    const logoPath = path.join(process.cwd(), "public", "logoempresa.png");

    try {
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await embedImage(pdfDoc, logoBytes, "logoempresa.png");

      const logoWidth = 92;
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

      page.drawImage(logoImage, {
        x: margin,
        y: y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    } catch {
      drawText("MotoCheck", margin, y - 20, {
        size: 18,
        bold: true,
      });
    }

    drawText("Termo de Recebimento e Condicoes do Veiculo", 160, y - 8, {
      size: 14,
      bold: true,
    });

    drawText(`Emitido em: ${formatDate(new Date().toISOString())}`, 170, y - 31, {
      size: 9,
      color: rgb(0.35, 0.35, 0.35),
    });

    y -= 68;

    // ===== CONTEUDO COMPACTO EM 1 PAGINA =====

    y -= 8;

    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.86, 0.86, 0.86),
    });

    y -= 22;

    // Declaracao compacta
    drawText("Declaracao de recebimento", margin, y, {
      size: 12,
      bold: true,
    });
    y -= 15;

    drawWrappedText(
      "Declaro estar ciente das condicoes registradas no momento da entrada do veiculo para atendimento. Este termo descreve a situacao visual informada e verificada, incluindo itens do checklist, observacoes e imagem quando disponivel.",
      margin,
      118,
      8.5,
      11
    );

    y -= 10;

    // Cards em 2 colunas
    const colGap = 14;
    const colWidth = (pageWidth - margin * 2 - colGap) / 2;
    const leftX = margin;
    const rightX = margin + colWidth + colGap;

    function drawInfoBox(
      title: string,
      lines: string[],
      x: number,
      boxY: number,
      width: number,
      height: number
    ) {
      page.drawRectangle({
        x,
        y: boxY - height,
        width,
        height,
        borderColor: rgb(0.88, 0.88, 0.88),
        borderWidth: 1,
        color: rgb(0.985, 0.985, 0.985),
      });

      page.drawText(sanitizeText(title), {
        x: x + 10,
        y: boxY - 16,
        size: 9,
        font: fontBold,
        color: rgb(0.12, 0.12, 0.12),
      });

      let lineY = boxY - 31;

      for (const line of lines) {
        page.drawText(sanitizeText(line), {
          x: x + 10,
          y: lineY,
          size: 8,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });

        lineY -= 12;
      }
    }

    const modeloMoto =
      [moto?.marca, moto?.modelo].filter(Boolean).join(" ") || "-";

    drawInfoBox(
      "Cliente",
      [
        `Nome: ${cliente?.nome ?? "-"}`,
        `Telefone: ${cliente?.telefone ?? "-"}`,
      ],
      leftX,
      y,
      colWidth,
      58
    );

    drawInfoBox(
      "Veiculo",
      [
        `Placa: ${moto?.placa ?? "-"}`,
        `Modelo: ${modeloMoto}`,
        `Ano/Cor: ${[moto?.ano, moto?.cor].filter(Boolean).join(" / ") || "-"}`,
      ],
      rightX,
      y,
      colWidth,
      58
    );

    y -= 72;

    drawText("Checklist de entrada", margin, y, {
      size: 12,
      bold: true,
    });
    y -= 14;

    // Tabela compacta do checklist em 2 colunas
    const itemGap = 8;
    const itemWidth = (pageWidth - margin * 2 - itemGap) / 2;
    const itemHeight = 34;

    for (let index = 0; index < checklist.length; index += 2) {
      const leftItem = checklist[index];
      const rightItem = checklist[index + 1];

      function drawChecklistItem(item: ChecklistItem | undefined, x: number) {
        if (!item) return;

        const title = getQuestionTitle(item);
        const answer = getChecklistAnswer(item);

        page.drawRectangle({
          x,
          y: y - itemHeight,
          width: itemWidth,
          height: itemHeight,
          borderColor: rgb(0.88, 0.88, 0.88),
          borderWidth: 1,
          color: rgb(0.99, 0.99, 0.99),
        });

        page.drawText(sanitizeText(title), {
          x: x + 8,
          y: y - 12,
          size: 7.8,
          font: fontBold,
          color: rgb(0.22, 0.22, 0.22),
        });

        page.drawText(sanitizeText(answer), {
          x: x + 8,
          y: y - 25,
          size: 8.8,
          font: fontRegular,
          color: rgb(0.08, 0.08, 0.08),
        });
      }

      drawChecklistItem(leftItem, margin);
      drawChecklistItem(rightItem, margin + itemWidth + itemGap);

      y -= itemHeight + 7;
    }

    // Observacao separada, se existir
    const observacaoItem = checklist.find(
      (item) =>
        item.item_modelo_id === "f1111111-1111-1111-1111-111111111111" &&
        (item.valor_texto || item.observacao)
    );

    if (observacaoItem) {
      y -= 3;

      drawText("Observacoes", margin, y, {
        size: 10,
        bold: true,
      });

      y -= 13;

      const obsText = observacaoItem.valor_texto || observacaoItem.observacao || "-";
      drawWrappedText(obsText, margin, 116, 8.2, 10);

      y -= 6;
    }

    // Foto compacta
    drawText("Imagem da entrada", margin, y, {
      size: 12,
      bold: true,
    });
    y -= 12;

    const imageBox = {
      x: margin,
      y: y - 135,
      width: pageWidth - margin * 2,
      height: 128,
    };

    page.drawRectangle({
      x: imageBox.x,
      y: imageBox.y,
      width: imageBox.width,
      height: imageBox.height,
      borderColor: rgb(0.82, 0.82, 0.82),
      borderWidth: 1,
      color: rgb(0.97, 0.97, 0.97),
    });

    if (visita.foto_entrada_url) {
      try {
        const photoBytes = await fetchImageBytes(visita.foto_entrada_url);
        const photoImage = await embedImage(
          pdfDoc,
          photoBytes,
          visita.foto_entrada_url
        );

        const isPortrait = photoImage.height > photoImage.width;

        if (isPortrait) {
          const scale = Math.min(
            imageBox.width / photoImage.height,
            imageBox.height / photoImage.width
          );

          const drawWidth = photoImage.height * scale;
          const drawHeight = photoImage.width * scale;

          const x = imageBox.x + (imageBox.width - drawWidth) / 2;
          const yImage = imageBox.y + (imageBox.height - drawHeight) / 2;

          page.drawImage(photoImage, {
            x: x + drawWidth,
            y: yImage,
            width: drawHeight,
            height: drawWidth,
            rotate: degrees(90),
          });
        } else {
          const scale = Math.min(
            imageBox.width / photoImage.width,
            imageBox.height / photoImage.height
          );

          const drawWidth = photoImage.width * scale;
          const drawHeight = photoImage.height * scale;

          page.drawImage(photoImage, {
            x: imageBox.x + (imageBox.width - drawWidth) / 2,
            y: imageBox.y + (imageBox.height - drawHeight) / 2,
            width: drawWidth,
            height: drawHeight,
          });
        }
      } catch {
        drawText("Imagem cadastrada, mas nao foi possivel carregar.", margin + 14, imageBox.y + 58, {
          size: 9,
          color: rgb(0.45, 0.45, 0.45),
        });
      }
    } else {
      drawText("Sem imagem registrada.", margin + 14, imageBox.y + 58, {
        size: 9,
        bold: true,
        color: rgb(0.45, 0.45, 0.45),
      });
    }

    y = imageBox.y - 28;

    // Assinatura no rodape
    drawText("Assinatura do cliente", margin, y, {
      size: 11,
      bold: true,
    });

    y -= 42;

    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.18, 0.18, 0.18),
    });

    y -= 13;

    drawText("Assinatura", margin, y, {
      size: 8,
      color: rgb(0.35, 0.35, 0.35),
    });

    drawText(`Cliente: ${cliente?.nome ?? "-"}`, margin + 210, y, {
      size: 8,
      color: rgb(0.35, 0.35, 0.35),
    });

    drawText(
      "Este termo registra as condicoes informadas no recebimento do veiculo.",
      margin,
      margin - 12,
      {
        size: 7,
        color: rgb(0.45, 0.45, 0.45),
      }
    );

    const pdfBytes = await pdfDoc.save();

    const filename = `termo-motocheck-${moto?.placa ?? id}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF da visita:", error);

    return NextResponse.json(
      {
        error: "Nao foi possivel gerar o PDF.",
      },
      { status: 500 }
    );
  }
}
