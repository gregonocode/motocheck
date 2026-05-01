import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type FotoAntiga = {
  name: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { data: fotosAntigas, error: queryError } = await supabaseAdmin
      .rpc("buscar_fotos_antigas_para_limpeza");

    if (queryError) {
      console.error("Erro ao buscar fotos antigas:", queryError);

      return NextResponse.json(
        { error: "Erro ao buscar fotos antigas", details: queryError.message },
        { status: 500 }
      );
    }

    if (!fotosAntigas || fotosAntigas.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Nenhuma foto antiga para excluir.",
        deleted: 0,
      });
    }

    const paths = (fotosAntigas as FotoAntiga[]).map(
      (foto: FotoAntiga) => foto.name
    );

    const { data: deletedData, error: deleteError } = await supabaseAdmin
      .storage
      .from("fotos")
      .remove(paths);

    if (deleteError) {
      console.error("Erro ao excluir fotos:", deleteError);

      return NextResponse.json(
        { error: "Erro ao excluir fotos", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Fotos antigas excluídas com sucesso.",
      deleted: paths.length,
      paths,
      result: deletedData,
    });
  } catch (error) {
    console.error("Erro inesperado ao limpar fotos:", error);

    return NextResponse.json(
      { error: "Erro inesperado ao limpar fotos" },
      { status: 500 }
    );
  }
}
