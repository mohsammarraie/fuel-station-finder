export interface Station {
  id: number
  externalId: number
  address: string
  latitude: number
  longitude: number
  distanceKm: number | null
}

export interface StationListResponse {
  data: Station[]
  meta: {
    count: number
  }
}

export interface GetStationsOptions {
  signal?: AbortSignal
  request?: typeof fetch
}

export class StationApiError extends Error {
  readonly status: number
  readonly requestId: string | null

  constructor(status: number, requestId: string | null) {
    super(`Station request failed with status ${status}.`)
    this.name = 'StationApiError'
    this.status = status
    this.requestId = requestId
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function getStations(
  options: GetStationsOptions = {},
): Promise<StationListResponse> {
  const request = options.request ?? fetch
  const response = await request(`${apiBaseUrl}/api/stations`, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new StationApiError(
      response.status,
      response.headers.get('x-request-id'),
    )
  }

  return (await response.json()) as StationListResponse
}
