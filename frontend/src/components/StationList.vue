<script setup lang="ts">
import type { Station } from '../api/stations'

defineProps<{ stations: readonly Station[] }>()
</script>

<template>
  <ol class="row row-cols-1 row-cols-md-2 g-3 p-0 list-unstyled" aria-label="Tankstellen">
    <li v-for="station in stations" :key="station.id" class="col">
      <article class="station-card card h-100 border-0 shadow-sm">
        <div class="card-body d-flex align-items-start gap-3 p-4">
          <div class="station-marker flex-shrink-0" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Zm0-8.25A2.75 2.75 0 1 1 12 7a2.75 2.75 0 0 1 0 5.5Z"
            />
          </svg>
          </div>

          <div class="flex-grow-1">
            <p class="eyebrow mb-1">Tankstelle</p>
            <h3 class="h6 fw-bold lh-base mb-0">{{ station.address }}</h3>
          </div>

          <span
            v-if="station.distanceKm !== null"
            class="distance-badge badge text-bg-light flex-shrink-0"
          >
            {{ station.distanceKm.toFixed(1) }} km
          </span>
        </div>
      </article>
    </li>
  </ol>
</template>
