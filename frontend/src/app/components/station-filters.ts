import { Component, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StationFilters, StationRadiusKm, StationSort } from '../stations/station.model';

@Component({
  selector: 'app-station-filters',
  imports: [ReactiveFormsModule],
  templateUrl: './station-filters.html',
})
export class StationFiltersComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  readonly disabled = input(false);
  readonly apply = output<StationFilters>();
  readonly resetFilters = output<void>();
  readonly locating = signal(false);
  readonly locationError = signal('');

  readonly form = this.formBuilder.group({
    search: ['', [Validators.maxLength(100)]],
    sort: ['asc' as StationSort],
    locationEnabled: [false],
    latitude: [50.9375, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [6.9603, [Validators.required, Validators.min(-180), Validators.max(180)]],
    radiusKm: [5 as StationRadiusKm],
  });
  readonly locationEnabled = toSignal(this.form.controls.locationEnabled.valueChanges, {
    initialValue: false,
  });

  constructor() {
    this.form.controls.locationEnabled.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((enabled) => {
        if (!enabled && ['nearest', 'farthest'].includes(this.form.controls.sort.value)) {
          this.form.controls.sort.setValue('asc');
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const filters: StationFilters = { sort: values.sort };
    const search = values.search.trim();
    if (search) filters.search = search;
    if (values.locationEnabled) {
      filters.latitude = values.latitude;
      filters.longitude = values.longitude;
      filters.radiusKm = values.radiusKm;
    }
    this.apply.emit(filters);
  }

  reset(): void {
    this.form.reset();
    this.locationError.set('');
    this.resetFilters.emit();
  }

  useCurrentLocation(): void {
    this.locationError.set('');
    if (!navigator.geolocation) {
      this.locationError.set('Die Standortabfrage wird nicht unterstützt.');
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.patchValue({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          locationEnabled: true,
        });
        this.locating.set(false);
      },
      () => {
        this.locationError.set('Der aktuelle Standort konnte nicht ermittelt werden.');
        this.locating.set(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }
}
