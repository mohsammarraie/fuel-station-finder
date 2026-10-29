export interface Station {
  id: number;
  externalId: number;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
}

export interface StationListResponse {
  data: Station[];
  meta: { count: number };
}

export type StationSort = 'asc' | 'desc' | 'nearest' | 'farthest';
export type StationRadiusKm = 2 | 5 | 10;

export interface StationFilters {
  search?: string;
  sort?: StationSort;
  latitude?: number;
  longitude?: number;
  radiusKm?: StationRadiusKm;
}
