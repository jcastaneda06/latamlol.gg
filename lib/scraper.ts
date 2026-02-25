import * as cheerio from "cheerio";

const PATCH_NOTES_LIST_URL =
  "https://www.leagueoflegends.com/es-mx/news/game-updates/";

interface PatchNoteSummary {
  version: string;
  title: string;
  url: string;
  publishedAt: string | null;
}

interface PatchNoteDetail {
  version: string;
  title: string;
  url: string;
  contentHtml: string;
  publishedAt: string | null;
  highlights: ChampionChange[];
}

interface ChampionChange {
  name: string;
  type: "buffed" | "nerfed" | "adjusted";
  changes: string[];
}

// Patch List
export async function scrapePatchList(): Promise<PatchNoteSummary[]> {
  try {
    const res = await fetch(PATCH_NOTES_LIST_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LoLLATAM/1.0)" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return getMockPatchList();

    const html = await res.text();
    const $ = cheerio.load(html);
    const patches: PatchNoteSummary[] = [];

    $("a[href*='/news/game-updates/patch']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const fullUrl = href.startsWith("http")
        ? href
        : `https://www.leagueoflegends.com${href}`;

      const versionMatch = href.match(/patch-(\d+)-(\d+)/);
      if (!versionMatch) return;

      const version = `${versionMatch[1]}.${versionMatch[2]}`;
      const title = $(el).find("h2, h3, .title, [class*='title']").first().text().trim()
        || `Notas del Parche ${version}`;
      const dateText = $(el).find("time, [class*='date']").attr("datetime")
        || $(el).find("time, [class*='date']").text().trim()
        || null;

      if (patches.every(p => p.version !== version)) {
        patches.push({ version, title: title || `Parche ${version}`, url: fullUrl, publishedAt: dateText });
      }
    });

    if (patches.length === 0) return getMockPatchList();
    return patches.slice(0, 15);
  } catch {
    return getMockPatchList();
  }
}

// Patch Detail
export async function scrapePatchDetail(url: string, version: string): Promise<PatchNoteDetail | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LoLLATAM/1.0)" },
      next: { revalidate: 86400 * 7 },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    $("script, style, nav, header, footer, [class*='ad'], [class*='cookie']").remove();

    const article = $("article, [class*='content'], [class*='article'], main").first();
    const contentHtml = article.html() ?? $("body").html() ?? "";

    const title = $("h1, [class*='title']").first().text().trim()
      || `Notas del Parche ${version}`;

    const dateEl = $("time").first();
    const publishedAt = dateEl.attr("datetime") ?? dateEl.text().trim() ?? null;

    const highlights = extractChampionChanges($, article);

    return {
      version,
      title,
      url,
      contentHtml: contentHtml.slice(0, 100000),
      publishedAt,
      highlights,
    };
  } catch {
    return null;
  }
}

// Champion Change Extractor
function extractChampionChanges(
  $: ReturnType<typeof cheerio.load>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: ReturnType<ReturnType<typeof cheerio.load>>
): ChampionChange[] {
  const changes: ChampionChange[] = [];

  $("h2, h3", container).each((_, el) => {
    const heading = $(el).text().trim();
    if (!heading || heading.length > 30) return;

    const skip = ["Objetos", "Sistema", "Campeones", "Runas", "Invocadores", "Miscelánea"];
    if (skip.some(s => heading.includes(s))) return;

    const changeList: string[] = [];
    let type: "buffed" | "nerfed" | "adjusted" = "adjusted";

    $(el).nextUntil("h2, h3").each((_, next) => {
      const text = $(next).text().trim();
      if (!text) return;
      changeList.push(text.slice(0, 200));

      const buffKeywords = /aumentó|aumenta|incrementó|mejoró|más|subió/i;
      const nerfKeywords = /redujo|reduce|disminuyó|menos|bajó|debilitado/i;
      if (buffKeywords.test(text)) type = "buffed";
      else if (nerfKeywords.test(text)) type = "nerfed";
    });

    if (changeList.length > 0) {
      changes.push({ name: heading, type, changes: changeList.slice(0, 10) });
    }
  });

  return changes.slice(0, 30);
}

// Mock Data (fallback)
function getMockPatchList(): PatchNoteSummary[] {
  return [
    {
      version: "15.3",
      title: "Notas del Parche 15.3",
      url: "https://www.leagueoflegends.com/es-mx/news/game-updates/patch-15-3-notes/",
      publishedAt: new Date().toISOString(),
    },
    {
      version: "15.2",
      title: "Notas del Parche 15.2",
      url: "https://www.leagueoflegends.com/es-mx/news/game-updates/patch-15-2-notes/",
      publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      version: "15.1",
      title: "Notas del Parche 15.1 — Inicio de Temporada 2025",
      url: "https://www.leagueoflegends.com/es-mx/news/game-updates/patch-15-1-notes/",
      publishedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
  ];
}
