import { describe, expect, it, vi } from 'vitest'
import { getStations, StationApiError } from './stations'

describe('getStations', () => {
  it('requests and returns the station list', async () => {
    const body = {
      data: [
        {
          id: 2,
          externalId: 98,
          address: 'Bonner Str. 98 (50677 Neustadt/Süd)',
          latitude: 50.916095,
          longitude: 6.960645,
          distanceKm: null,
        },
      ],
      meta: { count: 1 },
    }
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(getStations({ request })).resolves.toEqual(body)
    expect(request).toHaveBeenCalledWith('/api/stations', {
      headers: { Accept: 'application/json' },
      signal: undefined,
    })
  })

  it('exposes the status and request ID when the API fails', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 503,
        headers: { 'X-Request-Id': 'request-123' },
      }),
    )

    const error = await getStations({ request }).catch(
      (reason: unknown) => reason,
    )

    expect(error).toBeInstanceOf(StationApiError)
    expect(error).toMatchObject({ status: 503, requestId: 'request-123' })
  })
})
