import { NextRequest, NextResponse } from "next/server";
import { getAccountByRiotId } from "@/lib/riot";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");
  const region = searchParams.get("region") ?? "la1";

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "gameName y tagLine son requeridos" },
      { status: 400 }
    );
  }

  try {
    const account = await getAccountByRiotId(gameName, tagLine, region);
    return NextResponse.json(account);
  } catch (err: unknown) {
    const e = err as { status?: number; statusCode?: number; message?: string };
    const status = e?.status ?? e?.statusCode ?? 500;
    if (status === 404) {
      return NextResponse.json({ error: "Invocador no encontrado" }, { status: 404 });
    }
    if (status === 429) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, { status: 429 });
    }
    return NextResponse.json({ error: "Error al buscar el invocador" }, { status: 500 });
  }
}
