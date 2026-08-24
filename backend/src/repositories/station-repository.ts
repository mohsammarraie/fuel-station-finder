import type { QueryConfig } from "pg";
import { getDatabasePool } from "../database/client.js";
import type { StationListFilters } from "../validators/station-query.js";

interface StationListRow {
  id: number;
  external_id: number;
  address: string;
  latitude: number;
  longitude: number;
  distance_km: number | null;
}

export interface StationListItem {
  id: number;
  externalId: number;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
}

export interface StationRepository {
  findAll(filters: StationListFilters): Promise<StationListItem[]>;
}

export function buildStationListQuery(
  filters: StationListFilters,
): QueryConfig {
  const values: unknown[] = [];
  const conditions = ["is_active = TRUE"];
  let distanceExpression = "NULL::DOUBLE PRECISION";

  if (
    filters.latitude !== undefined &&
    filters.longitude !== undefined &&
    filters.radiusKm !== undefined
  ) {
    values.push(filters.longitude, filters.latitude);
    const longitudeParameter = `$${values.length - 1}`;
    const latitudeParameter = `$${values.length}`;
    const pointExpression = `
      ST_SetSRID(
        ST_MakePoint(
          ${longitudeParameter}::DOUBLE PRECISION,
          ${latitudeParameter}::DOUBLE PRECISION
        ),
        4326
      )::GEOGRAPHY
    `;

    values.push(filters.radiusKm * 1_000);
    const radiusParameter = `$${values.length}`;
    distanceExpression = `ST_Distance(location, ${pointExpression}) / 1000.0`;
    conditions.push(
      `ST_DWithin(location, ${pointExpression}, ${radiusParameter})`,
    );
  }

  if (filters.search !== undefined) {
    values.push(`%${escapeLikePattern(filters.search)}%`);
    conditions.push(`lower(address) LIKE lower($${values.length}) ESCAPE '!'`);
  }

  const sortDirection = filters.sort === "desc" ? "DESC" : "ASC";

  return {
    text: `
      SELECT
        id,
        external_id,
        address,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        ${distanceExpression} AS distance_km
      FROM stations
      WHERE ${conditions.join("\n        AND ")}
      ORDER BY lower(address) ${sortDirection}, id ${sortDirection}
    `,
    values,
  };
}

export class PostgresStationRepository implements StationRepository {
  async findAll(filters: StationListFilters): Promise<StationListItem[]> {
    const result = await getDatabasePool().query<StationListRow>(
      buildStationListQuery(filters),
    );

    return result.rows.map((row) => ({
      id: row.id,
      externalId: row.external_id,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm:
        row.distance_km === null
          ? null
          : Math.round(row.distance_km * 1_000) / 1_000,
    }));
  }
}

function escapeLikePattern(value: string): string {
  return value.replaceAll("!", "!!").replaceAll("%", "!%").replaceAll("_", "!_");
}
