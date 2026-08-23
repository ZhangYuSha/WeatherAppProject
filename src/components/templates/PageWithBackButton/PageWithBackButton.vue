<script setup lang="ts">
import { useRouter } from 'vue-router'
import './PageWithBackButton.css'

// Page-level layout template: back button + title + optional
// right-side action, with the page's own content passed in via
// the default slot. No business logic lives here.
//
// Callers should pass their own page class (e.g. class="account-page")
// on the component itself — Vue's automatic attribute fallthrough
// merges it onto this component's root <main>, which preserves each
// page's own shell styling (padding, min-height) and lets header
// sizing be overridden per page via CSS custom properties
// (see PageWithBackButton.css).
defineProps<{
  title: string
}>()

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <main class="page-with-back-button">
    <header class="page-with-back-button__header">
      <button
        class="page-with-back-button__back"
        type="button"
        aria-label="Go back"
        @click="goBack"
      >
        &lt;
      </button>

      <h1 class="page-with-back-button__title">
        {{ title }}
      </h1>

      <!-- Optional right-side action (e.g. save/delete on WeatherDetailPage) -->
      <slot name="action" />
    </header>

    <!-- Page-specific content -->
    <slot />
  </main>
</template>