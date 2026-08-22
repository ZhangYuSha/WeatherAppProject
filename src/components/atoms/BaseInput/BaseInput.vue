<!-- Vue 3 component using the <script setup> syntax -->
<!-- Implementing a reusable text input that supports v-model binding. -->
<script setup lang="ts">
import './BaseInput.css'
// Only available in <script setup lang="ts">
defineProps<{
  // Required string prop
  // Special name on custom component
  modelValue: string
  // Optional string (?), passed through to the native input's placeholder
  placeholder?: string
  // required string, for screen readers
  ariaLabel: string
}>()

// Declares 1 event, update:modelValue.
defineEmits<{
  // the value is a tuple type describing events argument
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <!-- value: The input's displayed value is driven entirely by the prop -->
  <!-- placeholder & aria-label: Bound straight from props -->
  <!-- Listens for native input events -->
  <!-- HTMLInputElement: Needed, Ts not know target concrete -->
  <input
  class="base-input"
    :value="modelValue"
    :placeholder="placeholder"
    :aria-label="ariaLabel"
    type="text"
    @input="
      $emit(
        'update:modelValue',
        ($event.target as HTMLInputElement).value
      )
    "
  />
</template>