import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StationFilters, StationListResponse } from './station.model';

@Injectable({ providedIn: 'root' })
export class StationApiService {
  private readonly http = inject(HttpClient);

  getStations(filters: StationFilters = {}): Observable<StationListResponse> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sort) params = params.set('sort', filters.sort);
    if (
      filters.latitude !== undefined &&
      filters.longitude !== undefined &&
      filters.radiusKm !== undefined
    ) {
      params = params
        .set('lat', filters.latitude)
        .set('lng', filters.longitude)
        .set('radius', filters.radiusKm);
    }
    return this.http.get<StationListResponse>('/api/stations', { params });
  }
}
