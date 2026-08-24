<template>
  <a class="skip-link visually-hidden-focusable" href="#main-content">
    Zum Inhalt springen
  </a>

  <header class="hero">
    <nav
      class="container d-flex align-items-center justify-content-between py-2"
      aria-label="Hauptnavigation"
    >
      <a
        class="brand d-inline-flex align-items-center gap-2 text-decoration-none"
        href="/"
      >
        <span class="brand__icon" aria-hidden="true">T</span>
        <span>Tankfinder <strong>Köln</strong></span>
        <span class="visually-hidden">– Startseite</span>
      </a>
      <span class="source-badge badge rounded-pill fw-semibold px-3 py-2">
        <span class="source-dot" aria-hidden="true"></span>
        Offene Daten der Stadt Köln
      </span>
    </nav>

    <div class="hero__content container position-relative">
      <p class="eyebrow">Schnell ans Ziel</p>
      <h1 class="display-5 fw-bold">
        Tankstellen in Köln <span>auf einen Blick.</span>
      </h1>
      <p class="hero__intro mb-0">
        Finde Tankstellen im Kölner Stadtgebiet – aktuell und auf Basis offener
        Daten.
      </p>
    </div>
    <div class="hero__shape" aria-hidden="true"></div>
  </header>
</template>
