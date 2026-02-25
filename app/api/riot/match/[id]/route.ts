import { NextRequest, NextResponse } from "next/server";
import { getMatch } from "@/lib/riot";
import { getCachedMatch, setCachedMatch } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const region = req.nextUrl.searchParams.get("region") ?? "la1";

  if (!matchId) {
    return NextResponse.json({ error: "matchId es requerido" }, { status: 400 });
  }

  const cached = await getCachedMatch(matchId);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const match = await getMatch(matchId, region);
    setCachedMatch(matchId, region, match).catch(() => {});
    return NextResponse.json(match);
  } catch (err: unknown) {
    const e = err as { status?: number; statusCode?: number };
    const status = e?.status ?? e?.statusCode ?? 500;
    if (status === 404) {
      return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al obtener la partida" }, { status: 500 });
  }
}
