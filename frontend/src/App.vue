<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import StationFilters from './components/StationFilters.vue'
import StationList from './components/StationList.vue'
import { useStations } from './composables/useStations'

const {
  stations,
  viewState,
  resultAnnouncement,
  applyFilters,
  resetFilters,
  retry,
} = useStations()
</script>

<template>
  <div class="app-shell bg-body-tertiary">
    <AppHeader />

    <main id="main-content" class="container py-4" tabindex="-1">
      <StationFilters
        :disabled="viewState === 'loading'"
        @apply="applyFilters"
        @reset="resetFilters"
      />

      <section aria-labelledby="station-heading">
        <p class="visually-hidden" aria-live="polite" aria-atomic="true">
          {{ resultAnnouncement }}
        </p>
        <div
          class="d-flex align-items-end justify-content-between gap-3 mb-4"
        >
          <div>
            <p class="eyebrow">Standorte</p>
            <h2 id="station-heading" class="fw-bold mb-0">Tankstellen</h2>
          </div>
          <span
            v-if="viewState === 'success'"
            class="badge rounded-pill text-bg-success px-3 py-2"
          >
            {{ stations.length }} Treffer
          </span>
        </div>

        <div
          v-if="viewState === 'loading'"
          class="state-card card border-0 shadow-sm p-4 d-flex flex-row align-items-center justify-content-center gap-3"
          role="status"
        >
          <span class="spinner-border text-success" aria-hidden="true"></span>
          <div>
            <h3 class="h6 fw-bold mb-1">Tankstellen werden geladen</h3>
            <p class="text-body-secondary mb-0">Einen kleinen Moment bitte.</p>
          </div>
        </div>

        <div
          v-else-if="viewState === 'error'"
          class="alert alert-danger text-center py-4"
          role="alert"
        >
          <h3 class="h6 fw-bold">Die Tankstellen konnten nicht geladen werden.</h3>
          <p>Prüfe die Verbindung und versuche es erneut.</p>
          <button type="button" class="btn btn-success" @click="retry">
            Erneut versuchen
          </button>
        </div>

        <div
          v-else-if="viewState === 'empty'"
          class="state-card card border-0 shadow-sm p-4 text-center"
        >
          <h3 class="h6 fw-bold mb-1">Keine Tankstellen gefunden</h3>
          <p class="text-body-secondary mb-0">
            Für diese Auswahl wurden keine Tankstellen gefunden.
          </p>
        </div>

        <StationList v-else :stations="stations" />
      </section>
    </main>

    <footer class="border-top">
      <p class="container py-4 mb-0 small text-body-secondary">
        Fuel Station Finder · Datenquelle: Stadt Köln
      </p>
    </footer>
  </div>
</template>
