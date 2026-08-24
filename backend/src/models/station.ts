export interface Station {
  id: number;
  externalId: number;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StationRow {
  id: number;
  external_id: number;
  address: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  last_seen_at: Date;
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
    isActive: row.is_active,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
