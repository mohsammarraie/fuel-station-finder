import { fireEvent, render, screen, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { getStations } from './api/stations'

vi.mock('./api/stations', () => ({
  getStations: vi.fn(),
}))

const getStationsMock = vi.mocked(getStations)
const stations = [
  {
    id: 2,
    externalId: 98,
    address: 'Bonner Str. 98 (50677 Neustadt/Süd)',
    latitude: 50.916095,
    longitude: 6.960645,
    distanceKm: null,
  },
  {
    id: 137,
    externalId: 108,
    address: 'Bonner Str. 417 (50968 Marienburg)',
    latitude: 50.900964,
    longitude: 6.96598,
    distanceKm: 1.725,
  },
]

describe('App', () => {
  beforeEach(() => {
    getStationsMock.mockReset()
  })

  it('announces that stations are loading', () => {
    getStationsMock.mockReturnValue(new Promise(() => undefined))

    render(App)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Tankstellen werden geladen',
    )
  })

  it('renders stations returned by the API', async () => {
    getStationsMock.mockResolvedValue({
      data: stations,
      meta: { count: stations.length },
    })

    render(App)

    const list = await screen.findByRole('list', { name: 'Tankstellen' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('2 Treffer')).toBeInTheDocument()
    expect(screen.getByText('2 Tankstellen gefunden.')).toBeInTheDocument()
    expect(screen.getByText('1.7 km')).toBeInTheDocument()
    expect(screen.queryByText(/50\.916095/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Zum Inhalt springen' }),
    ).toHaveAttribute('href', '#main-content')
  })

  it('shows an empty state when no stations are active', async () => {
    getStationsMock.mockResolvedValue({ data: [], meta: { count: 0 } })

    render(App)

    expect(
      await screen.findByText('Keine Tankstellen gefunden'),
    ).toBeInTheDocument()
  })

  it('allows a failed request to be retried', async () => {
    getStationsMock
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ data: stations, meta: { count: stations.length } })

    render(App)

    const alert = await screen.findByRole('alert')
    await fireEvent.click(
      within(alert).getByRole('button', { name: 'Erneut versuchen' }),
    )

    expect(
      await screen.findByText('Bonner Str. 98 (50677 Neustadt/Süd)'),
    ).toBeInTheDocument()
    expect(getStationsMock).toHaveBeenCalledTimes(2)
  })
})
