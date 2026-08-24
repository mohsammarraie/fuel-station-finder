import type { Migration } from "./types.js";

export const createStationsMigration: Migration = {
  version: 1,
  name: "create stations",
  async up(client) {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      CREATE TABLE stations (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        external_id INTEGER NOT NULL UNIQUE,
        address TEXT NOT NULL CHECK (length(trim(address)) > 0),
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT stations_longitude_check
          CHECK (ST_X(location::geometry) BETWEEN -180 AND 180),
        CONSTRAINT stations_latitude_check
          CHECK (ST_Y(location::geometry) BETWEEN -90 AND 90)
      );

      CREATE INDEX stations_location_idx ON stations USING GIST (location);
      CREATE INDEX stations_address_search_idx
        ON stations USING GIN (lower(address) gin_trgm_ops);

      CREATE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER stations_set_updated_at
      BEFORE UPDATE ON stations
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
  },
};
