import { NextResponse } from "next/server";
import { getAllItems, getAllSummonerSpells } from "@/lib/ddragon";

const SPELL_ID_TO_KEY: Record<number, string> = {
  1: "SummonerBoost",
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  13: "SummonerMana",
  14: "SummonerDot",
  21: "SummonerBarrier",
  32: "SummonerSnowball",
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export const runtime = "nodejs";

export type StaticItemInfo = { name: string; description?: string; gold?: number };
export type StaticSpellInfo = { name: string; description?: string; cooldown?: string };

export async function GET() {
  try {
    const [items, spells] = await Promise.all([
      getAllItems(),
      getAllSummonerSpells(),
    ]);

    const itemInfo: Record<string, StaticItemInfo> = {};
    for (const [id, data] of Object.entries(items)) {
      if (!data?.name) continue;
      const gold = data.gold?.total;
      const description = data.description ? stripHtml(data.description) : undefined;
      itemInfo[id] = {
        name: data.name,
        ...(description && { description }),
        ...(gold !== undefined && gold > 0 && { gold }),
      };
    }

    const spellInfoByKey: Record<string, StaticSpellInfo> = {};
    for (const spell of Object.values(spells)) {
      if (!spell?.name) continue;
      spellInfoByKey[spell.id] = {
        name: spell.name,
        description: (spell as { description?: string }).description,
        cooldown: (spell as { cooldownBurn?: string }).cooldownBurn,
      };
    }

    const spellInfo: Record<number, StaticSpellInfo> = {};
    for (const [id, key] of Object.entries(SPELL_ID_TO_KEY)) {
      spellInfo[parseInt(id, 10)] =
        spellInfoByKey[key] ?? { name: key.replace("Summoner", "") };
    }

    return NextResponse.json({ items: itemInfo, spells: spellInfo });
  } catch (err) {
    console.error("DDragon static error:", err);
    return NextResponse.json(
      { error: "Error al cargar datos estáticos" },
      { status: 500 }
    );
  }
}
