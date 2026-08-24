import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { getStations, type Station, type StationFilters } from '../api/stations'

export type StationViewState = 'loading' | 'success' | 'empty' | 'error'

export function useStations() {
  const stations = ref<Station[]>([])
  const viewState = ref<StationViewState>('loading')
  let activeFilters: StationFilters = {}
  let requestController: AbortController | undefined

  const resultAnnouncement = computed(() => {
    if (viewState.value === 'success') {
      return `${stations.value.length} Tankstellen gefunden.`
    }

    if (viewState.value === 'empty') {
      return 'Keine Tankstellen gefunden.'
    }

    return ''
  })

  async function requestStations(): Promise<void> {
    requestController?.abort()
    requestController = new AbortController()
    viewState.value = 'loading'

    try {
      const response = await getStations({
        filters: activeFilters,
        signal: requestController.signal,
      })
      stations.value = response.data
      viewState.value = response.data.length > 0 ? 'success' : 'empty'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      viewState.value = 'error'
    }
  }

  function applyFilters(filters: StationFilters): Promise<void> {
    activeFilters = { ...filters }
    return requestStations()
  }

  function resetFilters(): Promise<void> {
    activeFilters = {}
    return requestStations()
  }

  onMounted(requestStations)
  onBeforeUnmount(() => requestController?.abort())

  return {
    stations: readonly(stations),
    viewState: readonly(viewState),
    resultAnnouncement,
    applyFilters,
    resetFilters,
    retry: requestStations,
  }
}
