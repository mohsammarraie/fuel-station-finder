import type { Migration } from "./types.js";

export const addStationImportTrackingMigration: Migration = {
  version: 2,
  name: "add station import tracking",
  async up(client) {
    await client.query(`
      ALTER TABLE stations
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

      CREATE INDEX stations_active_idx ON stations (is_active);

      CREATE TABLE station_import_runs (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        status TEXT NOT NULL
          CHECK (status IN ('running', 'succeeded', 'failed')),
        source_url TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ,
        fetched_count INTEGER NOT NULL DEFAULT 0 CHECK (fetched_count >= 0),
        upserted_count INTEGER NOT NULL DEFAULT 0 CHECK (upserted_count >= 0),
        deactivated_count INTEGER NOT NULL DEFAULT 0
          CHECK (deactivated_count >= 0),
        error_message TEXT
      );

      CREATE INDEX station_import_runs_started_at_idx
        ON station_import_runs (started_at DESC);

      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.address IS DISTINCT FROM OLD.address
          OR NEW.location IS DISTINCT FROM OLD.location
          OR NEW.is_active IS DISTINCT FROM OLD.is_active
        THEN
          NEW.updated_at = CURRENT_TIMESTAMP;
        ELSE
          NEW.updated_at = OLD.updated_at;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  },
};
