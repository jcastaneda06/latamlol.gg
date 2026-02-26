-- Aggregate champion win rates from cached ranked matches.
-- Returns JSONB in the shape: { "ChampionKey": { "role": { "wins": N, "losses": N } } }
-- Compatible with the WinrateAggregate TypeScript type.

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

-- GIN index on queueId for faster filtering
CREATE INDEX IF NOT EXISTS idx_match_cache_queue
  ON match_cache USING btree (((data->'info'->>'queueId')::int));
