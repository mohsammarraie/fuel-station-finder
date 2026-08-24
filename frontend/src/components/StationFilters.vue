<script setup lang="ts">
import { ref } from 'vue'
import type {
  StationFilters,
  StationRadiusKm,
  StationSortDirection,
} from '../api/stations'

defineProps<{ disabled?: boolean }>()

const emit = defineEmits<{
  apply: [filters: StationFilters]
  reset: []
}>()

const search = ref('')
const sort = ref<StationSortDirection>('asc')
const locationEnabled = ref(false)
const latitude = ref('50.9375')
const longitude = ref('6.9603')
const radiusKm = ref<StationRadiusKm>(5)
const locating = ref(false)
const locationError = ref('')

function apply(): void {
  const filters: StationFilters = { sort: sort.value }
  const normalizedSearch = search.value.trim()

  if (normalizedSearch) {
    filters.search = normalizedSearch
  }

  if (locationEnabled.value) {
    filters.latitude = Number(latitude.value)
    filters.longitude = Number(longitude.value)
    filters.radiusKm = radiusKm.value
  }

  emit('apply', filters)
}

function reset(): void {
  search.value = ''
  sort.value = 'asc'
  locationEnabled.value = false
  latitude.value = '50.9375'
  longitude.value = '6.9603'
  radiusKm.value = 5
  locationError.value = ''
  emit('reset')
}

function useCurrentLocation(): void {
  locationError.value = ''

  if (!navigator.geolocation) {
    locationError.value = 'Die Standortabfrage wird nicht unterstützt.'
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      latitude.value = position.coords.latitude.toFixed(6)
      longitude.value = position.coords.longitude.toFixed(6)
      locationEnabled.value = true
      locating.value = false
    },
    () => {
      locationError.value = 'Der aktuelle Standort konnte nicht ermittelt werden.'
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10_000 },
  )
}
</script>

<template>
  <form class="filter-card card border-0 shadow-sm p-4 mb-5" @submit.prevent="apply">
    <div class="row g-3 align-items-end">
      <div class="col-12 col-md-7">
        <label class="form-label fw-semibold" for="station-search">
          Straße suchen
        </label>
        <input
          id="station-search"
          v-model="search"
          class="form-control"
          type="search"
          maxlength="100"
          placeholder="z. B. Bonner"
          :disabled="disabled"
        />
      </div>

      <div class="col-12 col-md-5">
        <label class="form-label fw-semibold" for="station-sortierung">
          Sortierung
        </label>
        <select
          id="station-sortierung"
          v-model="sort"
          class="form-select"
          :disabled="disabled"
        >
          <option value="asc">Straße aufsteigend (A–Z)</option>
          <option value="desc">Straße absteigend (Z–A)</option>
        </select>
      </div>
    </div>

    <div class="form-check form-switch mt-4">
      <input
        id="location-filter"
        v-model="locationEnabled"
        class="form-check-input"
        type="checkbox"
        role="switch"
        :disabled="disabled"
      />
      <label class="form-check-label fw-semibold" for="location-filter">
        Nach Umkreis filtern
      </label>
    </div>

    <fieldset v-if="locationEnabled" class="border-0 p-0 mt-3">
      <legend class="visually-hidden">Position und Suchradius</legend>
      <div class="row g-3 align-items-end">
        <div class="col-12 col-sm-4">
          <label class="form-label" for="station-latitude">Breitengrad</label>
          <input
            id="station-latitude"
            v-model="latitude"
            class="form-control"
            type="number"
            min="-90"
            max="90"
            step="any"
            required
            :disabled="disabled"
          />
        </div>

        <div class="col-12 col-sm-4">
          <label class="form-label" for="station-longitude">Längengrad</label>
          <input
            id="station-longitude"
            v-model="longitude"
            class="form-control"
            type="number"
            min="-180"
            max="180"
            step="any"
            required
            :disabled="disabled"
          />
        </div>

        <div class="col-12 col-sm-4">
          <label class="form-label" for="station-radius">Radius</label>
          <select
            id="station-radius"
            v-model="radiusKm"
            class="form-select"
            :disabled="disabled"
          >
            <option :value="2">2 km</option>
            <option :value="5">5 km</option>
            <option :value="10">10 km</option>
          </select>
        </div>
      </div>

      <button
        class="btn btn-outline-success btn-sm mt-3"
        type="button"
        :disabled="disabled || locating"
        @click="useCurrentLocation"
      >
        {{ locating ? 'Standort wird ermittelt …' : 'Meinen Standort verwenden' }}
      </button>
      <p v-if="locationError" class="text-danger small mt-2 mb-0" role="alert">
        {{ locationError }}
      </p>
    </fieldset>

    <div class="d-flex flex-wrap gap-2 mt-4">
      <button class="btn btn-success" type="submit" :disabled="disabled">
        Filter anwenden
      </button>
      <button
        class="btn btn-outline-secondary"
        type="button"
        :disabled="disabled"
        @click="reset"
      >
        Zurücksetzen
      </button>
    </div>
  </form>
</template>
