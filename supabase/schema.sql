-- LoL LATAM Stats — Supabase Schema
-- Run this in your Supabase project's SQL Editor

-- Match cache (permanent — matches never change)
CREATE TABLE IF NOT EXISTS match_cache (
  match_id  TEXT PRIMARY KEY,
  region    TEXT NOT NULL,
  data      JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_match_cache_region ON match_cache(region);
CREATE INDEX IF NOT EXISTS idx_match_cache_cached_at ON match_cache(cached_at);

-- Auto-delete matches older than 7 days (optional, run periodically)
-- DELETE FROM match_cache WHERE cached_at < now() - interval '7 days';

-- ─────────────────────────────────────────────────────────────────────────────

-- Summoner profile cache (10 min TTL enforced in app)
CREATE TABLE IF NOT EXISTS summoner_cache (
  puuid         TEXT PRIMARY KEY,
  region        TEXT NOT NULL,
  summoner_data JSONB NOT NULL,
  ranked_data   JSONB,
  cached_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_summoner_cache_region ON summoner_cache(region);

-- ─────────────────────────────────────────────────────────────────────────────

-- Champion static data per patch (6h TTL)
CREATE TABLE IF NOT EXISTS champion_data_cache (
  champion_id   TEXT NOT NULL,
  patch_version TEXT NOT NULL,
  ddragon_data  JSONB NOT NULL,
  meraki_data   JSONB,
  cached_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (champion_id, patch_version)
);

-- ─────────────────────────────────────────────────────────────────────────────

-- Tier list per patch + queue (6h TTL)
CREATE TABLE IF NOT EXISTS tier_list_cache (
  patch_version TEXT NOT NULL,
  queue_type    TEXT NOT NULL,  -- 'ranked', 'aram'
  data          JSONB NOT NULL,
  cached_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (patch_version, queue_type)
);

-- ─────────────────────────────────────────────────────────────────────────────

-- Scraped patch notes (permanent once scraped)
CREATE TABLE IF NOT EXISTS patch_notes (
  version      TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  content_html TEXT,
  highlights   JSONB,     -- champion changes extracted
  published_at TIMESTAMPTZ,
  scraped_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patch_notes_published_at ON patch_notes(published_at DESC);

-- Summoner search index (populated from match participants for prefix search)
CREATE TABLE IF NOT EXISTS summoner_search (
  puuid         TEXT NOT NULL,
  region        TEXT NOT NULL,
  riot_id       TEXT NOT NULL,
  profile_icon_id INT DEFAULT 0,
  last_seen     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (puuid, region)
);

CREATE INDEX IF NOT EXISTS idx_summoner_search_region_riot_id
  ON summoner_search(region, riot_id text_pattern_ops);

-- Rank snapshots for LP delta calculation (per-match LP gain/loss)
CREATE TABLE IF NOT EXISTS rank_snapshots (
  id         BIGSERIAL PRIMARY KEY,
  puuid      TEXT NOT NULL,
  region     TEXT NOT NULL,
  queue_type TEXT NOT NULL,
  tier       TEXT NOT NULL,
  rank       TEXT NOT NULL DEFAULT 'I',
  league_points INT NOT NULL DEFAULT 0,
  wins       INT NOT NULL DEFAULT 0,
  losses     INT NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rank_snapshots_puuid_region
  ON rank_snapshots(puuid, region);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_fetched_at
  ON rank_snapshots(puuid, region, queue_type, fetched_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) — Allow anonymous reads, no writes from client
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE match_cache       ENABLE ROW LEVEL SECURITY;
ALTER TABLE summoner_cache    ENABLE ROW LEVEL SECURITY;
ALTER TABLE summoner_search   ENABLE ROW LEVEL SECURITY;
ALTER TABLE champion_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_list_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patch_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_snapshots    ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (server-side uses service role key for writes)
CREATE POLICY "Allow anon read match_cache"
  ON match_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read summoner_cache"
  ON summoner_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read champion_data_cache"
  ON champion_data_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read tier_list_cache"
  ON tier_list_cache FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read patch_notes"
  ON patch_notes FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read summoner_search"
  ON summoner_search FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read rank_snapshots"
  ON rank_snapshots FOR SELECT TO anon USING (true);

-- Note: For server-side writes, use SUPABASE_SERVICE_ROLE_KEY instead of ANON_KEY
-- Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=...

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: Aggregate champion win rates from cached ranked matches
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION aggregate_champion_winrates()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(jsonb_object_agg(champion_key, role_data), '{}'::jsonb)
  FROM (
    SELECT
      champion_key,
      jsonb_object_agg(position, jsonb_build_object('wins', wins, 'losses', losses)) AS role_data
    FROM (
      SELECT
        regexp_replace(p->>'championName', '[^a-zA-Z0-9]', '', 'g') AS champion_key,
        CASE p->>'teamPosition'
          WHEN 'TOP'     THEN 'top'
          WHEN 'JUNGLE'  THEN 'jungle'
          WHEN 'MIDDLE'  THEN 'mid'
          WHEN 'BOTTOM'  THEN 'adc'
          WHEN 'UTILITY' THEN 'support'
        END AS position,
        COUNT(*) FILTER (WHERE (p->>'win')::boolean)       AS wins,
        COUNT(*) FILTER (WHERE NOT (p->>'win')::boolean)   AS losses
      FROM match_cache,
           jsonb_array_elements(data->'info'->'participants') AS p
      WHERE (data->'info'->>'queueId')::int = 420
        AND p->>'teamPosition' IN ('TOP','JUNGLE','MIDDLE','BOTTOM','UTILITY')
        AND p->>'championName' IS NOT NULL
        AND p->>'championName' <> ''
      GROUP BY 1, 2
    ) stats
    WHERE champion_key <> ''
    GROUP BY champion_key
  ) grouped;
$$;

CREATE INDEX IF NOT EXISTS idx_match_cache_queue
  ON match_cache USING btree (((data->'info'->>'queueId')::int));
