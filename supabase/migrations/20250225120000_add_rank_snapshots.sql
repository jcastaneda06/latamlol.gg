-- Add rank_snapshots table for LP delta calculation
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

ALTER TABLE rank_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read rank_snapshots"
  ON rank_snapshots FOR SELECT TO anon USING (true);
