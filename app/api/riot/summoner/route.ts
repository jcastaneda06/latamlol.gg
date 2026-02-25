import { NextRequest, NextResponse } from "next/server";
import { getSummonerByPuuid, getRankedByPuuid } from "@/lib/riot";
import { getCachedSummoner, setCachedSummoner } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const puuid = searchParams.get("puuid");
  const region = searchParams.get("region") ?? "la1";

  if (!puuid) {
    return NextResponse.json({ error: "puuid es requerido" }, { status: 400 });
  }

  // Try cache first
  const cached = await getCachedSummoner(puuid);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const [summoner, ranked] = await Promise.all([
      getSummonerByPuuid(puuid, region),
      getRankedByPuuid(puuid, region),
    ]);

    // Cache in background
    setCachedSummoner(puuid, region, summoner, ranked).catch(() => {});

    return NextResponse.json({ summoner, ranked });
  } catch (err: unknown) {
    const e = err as { status?: number; statusCode?: number };
    const status = e?.status ?? e?.statusCode ?? 500;
    if (status === 404) {
      return NextResponse.json({ error: "Invocador no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al obtener datos del invocador" }, { status: 500 });
  }
}
