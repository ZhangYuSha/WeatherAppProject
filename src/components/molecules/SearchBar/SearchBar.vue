<script setup lang="ts">
import './SearchBar.css'
import BaseInput from '../../atoms/BaseInput/BaseInput.vue'
//Make searchbar v-model compatible, no need to touch the value directly -->
//Format: SearchBar v-model="..." -->

defineProps<{
  modelValue: string
}>()

//Re-emitted to the parrent whenever input change
defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="search-bar">
  <!-- Decorative search icon -->
    <span class="search-bar__icon" aria-hidden="true">⌕</span>

  <!-- Pass modelValue down, and relay baseInput's update -->
    <BaseInput
      :model-value="modelValue"
      placeholder="Search for a city or airport"
      aria-label="Search for a city or airport"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>