import { Component, inject } from '@angular/core';
import { AppHeader } from './components/app-header';
import { StationFiltersComponent } from './components/station-filters';
import { StationList } from './components/station-list';
import { StationStore } from './stations/station.store';

@Component({
  selector: 'app-root',
  imports: [AppHeader, StationFiltersComponent, StationList],
  providers: [StationStore],
  templateUrl: './app.html',
})
export class App {
  readonly store = inject(StationStore);
}
