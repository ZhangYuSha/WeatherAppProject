<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '../components/molecules/SearchBar/SearchBar.vue'

const searchQuery = ref('')
</script>

<template>
  <main class="city-list-page">
    <header class="city-list-page__header">
      <h1 class="city-list-page__title">Weather</h1>
    </header>

    <SearchBar v-model="searchQuery" />

    <p v-if="searchQuery">
      Searching for: {{ searchQuery }}
    </p>
  </main>
</template>

<style scoped>
.city-list-page {
  padding: 24px;
}

.city-list-page__header {
  margin-bottom: 24px;
}

.city-list-page__title {
  margin: 0;
}
</style>