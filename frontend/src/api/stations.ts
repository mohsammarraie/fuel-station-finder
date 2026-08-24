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

export type StationSortDirection = 'asc' | 'desc'
export type StationRadiusKm = 2 | 5 | 10

export interface StationFilters {
  search?: string
  sort?: StationSortDirection
  latitude?: number
  longitude?: number
  radiusKm?: StationRadiusKm
}

export interface GetStationsOptions {
  filters?: StationFilters
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

export function buildStationUrl(filters: StationFilters = {}): string {
  const parameters = new URLSearchParams()

  if (filters.search) {
    parameters.set('search', filters.search)
  }

  if (filters.sort) {
    parameters.set('sort', filters.sort)
  }

  if (
    filters.latitude !== undefined &&
    filters.longitude !== undefined &&
    filters.radiusKm !== undefined
  ) {
    parameters.set('lat', String(filters.latitude))
    parameters.set('lng', String(filters.longitude))
    parameters.set('radius', String(filters.radiusKm))
  }

  const query = parameters.toString()
  return `${apiBaseUrl}/api/stations${query ? `?${query}` : ''}`
}

export async function getStations(
  options: GetStationsOptions = {},
): Promise<StationListResponse> {
  const request = options.request ?? fetch
  const response = await request(buildStationUrl(options.filters), {
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
