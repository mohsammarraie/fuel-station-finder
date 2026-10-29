import { TestBed } from '@angular/core/testing';
import { StationFiltersComponent } from './station-filters';
import { StationFilters } from '../stations/station.model';

describe('StationFiltersComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [StationFiltersComponent] }));

  function setup() {
    const fixture = TestBed.createComponent(StationFiltersComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = (selector: string, value: string) => {
      const control = element.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
      if (control instanceof HTMLSelectElement && selector === '#station-radius') {
        control.value = Array.from(control.options).find((option) => option.textContent?.trim() === `${value} km`)!.value;
      } else {
        control.value = value;
      }
      control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
      fixture.detectChanges();
    };
    const click = (selector: string) => {
      element.querySelector<HTMLElement>(selector)!.click();
      fixture.detectChanges();
    };
    return { fixture, element, input, click };
  }

  it('trims search and submits address sorting', () => {
    const { fixture, input, click } = setup();
    let submitted: StationFilters | undefined;
    fixture.componentInstance.apply.subscribe((filters) => submitted = filters);
    input('#station-search', ' Bonner ');
    input('#station-sortierung', 'desc');
    click('button[type="submit"]');
    expect(submitted).toEqual({ search: 'Bonner', sort: 'desc' });
  });

  it('submits a location and restores address sorting when radius is disabled', () => {
    const { fixture, element, input, click } = setup();
    let submitted: StationFilters | undefined;
    fixture.componentInstance.apply.subscribe((filters) => submitted = filters);
    click('#location-filter');
    input('#station-latitude', '50.916095');
    input('#station-longitude', '6.960645');
    input('#station-radius', '10');
    input('#station-sortierung', 'nearest');
    click('button[type="submit"]');
    expect(submitted).toEqual({ sort: 'nearest', latitude: 50.916095, longitude: 6.960645, radiusKm: 10 });
    click('#location-filter');
    expect((element.querySelector('#station-sortierung') as HTMLSelectElement).value).toBe('asc');
  });

  it('resets form controls and emits a reset event', () => {
    const { fixture, element, input, click } = setup();
    let resets = 0;
    fixture.componentInstance.resetFilters.subscribe(() => resets++);
    input('#station-search', 'Bonner');
    click('#location-filter');
    element.querySelectorAll<HTMLButtonElement>('button[type="button"]')[1].click();
    fixture.detectChanges();
    expect((element.querySelector('#station-search') as HTMLInputElement).value).toBe('');
    expect(element.querySelector('#station-latitude')).toBeNull();
    expect(resets).toBe(1);
  });
});
