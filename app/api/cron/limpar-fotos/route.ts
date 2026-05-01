import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { data: fotosAntigas, error: queryError } = await supabaseAdmin
      .schema("storage")
      .from("objects")
      .select("name, created_at")
      .eq("bucket_id", "fotos")
      .lt("created_at", new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString());

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

    const paths = fotosAntigas.map((foto) => foto.name);

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