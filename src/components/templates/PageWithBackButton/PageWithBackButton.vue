<script setup lang="ts">
import { useRouter } from 'vue-router'
import './PageWithBackButton.css'

// Page-level layout template: back button + title + optional
// right-side action, with the page's own content passed in
// via the default slot. No business logic lives here — that
// stays in the Page components that use this template.
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