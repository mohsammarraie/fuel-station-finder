export interface Station {
  id: number;
  externalId: number;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StationRow {
  id: number;
  external_id: number;
  address: string;
  latitude: number;
  longitude: number;
  created_at: Date;
  updated_at: Date;
}

export function mapStationRow(row: StationRow): Station {
  return {
    id: row.id,
    externalId: row.external_id,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
