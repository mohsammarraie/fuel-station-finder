import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StationApiService } from './station-api.service';

const response = { data: [], meta: { count: 0 } };

describe('StationApiService', () => {
  let service: StationApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(StationApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes combined search, sort, and location filters', () => {
    service.getStations({ search: 'Bonner Str.', sort: 'nearest', latitude: 50.94, longitude: 6.96, radiusKm: 5 })
      .subscribe((result) => expect(result).toEqual(response));

    const request = http.expectOne((candidate) => candidate.url === '/api/stations');
    expect(request.request.params.toString()).toBe('search=Bonner%20Str.&sort=nearest&lat=50.94&lng=6.96&radius=5');
    request.flush(response);
  });

  it('omits incomplete location groups', () => {
    service.getStations({ sort: 'asc', latitude: 50.94 }).subscribe();
    const request = http.expectOne('/api/stations?sort=asc');
    request.flush(response);
  });
});
