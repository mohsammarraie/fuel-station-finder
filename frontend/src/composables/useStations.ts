import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue'
import { getStations, type Station } from '../api/stations'

export type StationViewState = 'loading' | 'success' | 'empty' | 'error'

export function useStations() {
  const stations = ref<Station[]>([])
  const viewState = ref<StationViewState>('loading')
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

  async function loadStations(): Promise<void> {
    requestController?.abort()
    requestController = new AbortController()
    viewState.value = 'loading'

    try {
      const response = await getStations({ signal: requestController.signal })
      stations.value = response.data
      viewState.value = response.data.length > 0 ? 'success' : 'empty'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      viewState.value = 'error'
    }
  }

  onMounted(loadStations)
  onBeforeUnmount(() => requestController?.abort())

  return {
    stations: readonly(stations),
    viewState: readonly(viewState),
    resultAnnouncement,
    loadStations,
  }
}
