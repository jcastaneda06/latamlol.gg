import { NextRequest, NextResponse } from "next/server";
import { getLiveGame } from "@/lib/riot";

export const runtime = "nodejs";

// Live game: no caching (always fresh)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const summonerId = searchParams.get("summonerId");
  const region = searchParams.get("region") ?? "la1";

  if (!summonerId) {
    return NextResponse.json({ error: "summonerId es requerido" }, { status: 400 });
  }

  try {
    const game = await getLiveGame(summonerId, region);
    if (!game) {
      return NextResponse.json({ inGame: false }, { status: 200 });
    }
    return NextResponse.json({ inGame: true, game });
  } catch (err: unknown) {
    const e = err as { status?: number; statusCode?: number };
    const status = e?.status ?? e?.statusCode ?? 500;
    if (status === 404) {
      return NextResponse.json({ inGame: false }, { status: 200 });
    }
    return NextResponse.json({ error: "Error al obtener partida en vivo" }, { status: 500 });
  }
}
