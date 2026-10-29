import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, concat, map, of, startWith, Subject, switchMap } from 'rxjs';
import { StationApiService } from './station-api.service';
import { Station, StationFilters } from './station.model';

type StationState =
  | { status: 'loading'; stations: Station[] }
  | { status: 'success'; stations: Station[] }
  | { status: 'empty'; stations: Station[] }
  | { status: 'error'; stations: Station[] };

@Injectable()
export class StationStore {
  private readonly api = inject(StationApiService);
  private readonly requests = new Subject<StationFilters>();
  private activeFilters: StationFilters = {};

  // switchMap unsubscribes from the previous HttpClient request when filters change.
  readonly state = toSignal(
    this.requests.pipe(
      startWith(this.activeFilters),
      switchMap((filters) =>
        concat(
          of<StationState>({ status: 'loading', stations: [] }),
          this.api.getStations(filters).pipe(
            map((response): StationState => ({
              status: response.data.length ? 'success' : 'empty',
              stations: response.data,
            })),
            catchError(() => of<StationState>({ status: 'error', stations: [] })),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading', stations: [] } as StationState },
  );

  readonly resultAnnouncement = computed(() => {
    const state = this.state();
    if (state.status === 'success') return `${state.stations.length} Tankstellen gefunden.`;
    if (state.status === 'empty') return 'Keine Tankstellen gefunden.';
    return '';
  });

  applyFilters(filters: StationFilters): void {
    this.activeFilters = { ...filters };
    this.requests.next(this.activeFilters);
  }

  resetFilters(): void {
    this.applyFilters({});
  }

  retry(): void {
    this.requests.next(this.activeFilters);
  }
}
