import type { MetadataRoute } from "next";
import { getAllChampions } from "@/lib/ddragon";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const regions = ["la1", "la2"];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/campeones"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/parches"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...regions.map((region) => ({
      url: absoluteUrl(`/clasificacion/${region}`),
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];

  const champions = await getAllChampions().catch(() => ({}));
  const championIds = Object.keys(champions);

  const championRoutes: MetadataRoute.Sitemap = championIds.flatMap((id) => [
    {
      url: absoluteUrl(`/campeones/${id}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl(`/campeones/${id}/construcciones`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ]);

  return [...staticRoutes, ...championRoutes];
}
