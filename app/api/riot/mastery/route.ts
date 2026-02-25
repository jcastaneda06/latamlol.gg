import { NextRequest, NextResponse } from "next/server";
import { getMasteryByPuuid } from "@/lib/riot";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const puuid = searchParams.get("puuid");
  const region = searchParams.get("region") ?? "la1";
  const count = parseInt(searchParams.get("count") ?? "10");

  if (!puuid) {
    return NextResponse.json({ error: "puuid es requerido" }, { status: 400 });
  }

  try {
    const mastery = await getMasteryByPuuid(puuid, region, count);
    return NextResponse.json(mastery, {
      headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=60" },
    });
  } catch (err: unknown) {
    console.error("Mastery error:", err);
    return NextResponse.json({ error: "Error al obtener maestría" }, { status: 500 });
  }
}
