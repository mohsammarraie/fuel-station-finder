import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import StationFilters from './StationFilters.vue'

describe('StationFilters', () => {
  it('submits normalized street search and sorting', async () => {
    const { emitted } = render(StationFilters)

    await fireEvent.update(screen.getByLabelText('Straße suchen'), ' Bonner ')
    await fireEvent.update(
      screen.getByLabelText('Sortierung'),
      'desc',
    )
    await fireEvent.click(screen.getByRole('button', { name: 'Filter anwenden' }))

    expect(emitted().apply?.[0]).toEqual([
      { search: 'Bonner', sort: 'desc' },
    ])
  })

  it('submits a freely selected position and allowed radius', async () => {
    const { emitted } = render(StationFilters)

    await fireEvent.click(screen.getByRole('switch', { name: 'Nach Umkreis filtern' }))
    await fireEvent.update(screen.getByLabelText('Breitengrad'), '50.916095')
    await fireEvent.update(screen.getByLabelText('Längengrad'), '6.960645')
    await fireEvent.update(screen.getByLabelText('Radius'), '10')
    await fireEvent.click(screen.getByRole('button', { name: 'Filter anwenden' }))

    expect(emitted().apply?.[0]).toEqual([
      {
        sort: 'asc',
        latitude: 50.916095,
        longitude: 6.960645,
        radiusKm: 10,
      },
    ])
  })

  it('offers distance sorting only with an active location filter', async () => {
    const { emitted } = render(StationFilters)
    const nearestOption = screen.getByRole('option', {
      name: 'Entfernung: nächste zuerst',
    })

    expect(nearestOption).toBeDisabled()

    await fireEvent.click(screen.getByRole('switch', { name: 'Nach Umkreis filtern' }))
    expect(nearestOption).toBeEnabled()

    await fireEvent.update(screen.getByLabelText('Sortierung'), 'farthest')
    await fireEvent.click(screen.getByRole('button', { name: 'Filter anwenden' }))

    expect(emitted().apply?.[0]).toEqual([
      {
        sort: 'farthest',
        latitude: 50.9375,
        longitude: 6.9603,
        radiusKm: 5,
      },
    ])
  })

  it('restores address sorting when location filtering is disabled', async () => {
    render(StationFilters)
    const locationSwitch = screen.getByRole('switch', {
      name: 'Nach Umkreis filtern',
    })
    const sortSelect = screen.getByLabelText('Sortierung')

    await fireEvent.click(locationSwitch)
    await fireEvent.update(sortSelect, 'nearest')
    await fireEvent.click(locationSwitch)

    expect(sortSelect).toHaveValue('asc')
  })

  it('clears the controls and requests the complete list', async () => {
    const { emitted } = render(StationFilters)

    await fireEvent.update(screen.getByLabelText('Straße suchen'), 'Bonner')
    await fireEvent.click(screen.getByRole('switch', { name: 'Nach Umkreis filtern' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Zurücksetzen' }))

    expect(screen.getByLabelText('Straße suchen')).toHaveValue('')
    expect(screen.queryByLabelText('Breitengrad')).not.toBeInTheDocument()
    expect(emitted().reset).toHaveLength(1)
  })
})
