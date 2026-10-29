import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

const stations = [
  { id: 2, externalId: 98, address: 'Bonner Str. 98', latitude: 50.916095, longitude: 6.960645, distanceKm: null },
  { id: 137, externalId: 108, address: 'Bonner Str. 417', latitude: 50.900964, longitude: 6.96598, distanceKm: 1.725 },
];

describe('App', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [App],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }));

  function setup() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    return { fixture, http, element: fixture.nativeElement as HTMLElement };
  }

  it('shows loading then renders the station list and count', () => {
    const { fixture, http, element } = setup();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Tankstellen werden geladen');
    http.expectOne('/api/stations').flush({ data: stations, meta: { count: 2 } });
    fixture.detectChanges();
    expect(element.querySelectorAll('ol[aria-label="Tankstellen"] li')).toHaveLength(2);
    expect(element.textContent).toContain('2 Treffer');
    expect(element.textContent).toContain('2 Tankstellen gefunden.');
    expect(element.textContent).toContain('1.7 km');
    expect(element.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main-content');
    http.verify();
  });

  it('shows empty results', () => {
    const { fixture, http, element } = setup();
    http.expectOne('/api/stations').flush({ data: [], meta: { count: 0 } });
    fixture.detectChanges();
    expect(element.textContent).toContain('Keine Tankstellen gefunden');
    http.verify();
  });

  it('retries a failed request', () => {
    const { fixture, http, element } = setup();
    http.expectOne('/api/stations').flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    http.expectOne('/api/stations').flush({ data: stations, meta: { count: 2 } });
    fixture.detectChanges();
    expect(element.textContent).toContain('Bonner Str. 98');
    http.verify();
  });

  it('cancels an earlier request when filters are applied', () => {
    const { fixture, http } = setup();
    const first = http.expectOne('/api/stations');
    fixture.componentInstance.store.applyFilters({ search: 'Bonner', sort: 'asc' });
    expect(first.cancelled).toBe(true);
    http.expectOne('/api/stations?search=Bonner&sort=asc').flush({ data: [], meta: { count: 0 } });
    http.verify();
  });

  it('retries with the last applied filters', () => {
    const { fixture, http, element } = setup();
    http.expectOne('/api/stations').flush({ data: stations, meta: { count: 2 } });
    fixture.componentInstance.store.applyFilters({ search: 'Bonner', sort: 'desc' });
    http.expectOne('/api/stations?search=Bonner&sort=desc')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    http.expectOne('/api/stations?search=Bonner&sort=desc')
      .flush({ data: stations, meta: { count: 2 } });
    http.verify();
  });
});
