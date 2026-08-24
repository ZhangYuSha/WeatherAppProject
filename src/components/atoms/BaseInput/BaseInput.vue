<script setup lang="ts">
import './BaseInput.css'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  keydown: [event: KeyboardEvent]
}>()
</script>

<template>

  <!--
    On input, cast the native event target and emit the new value for v-model binding.
    On keydown, forward the raw event to the parent for custom handling (e.g. Enter/Escape).
  -->
  <input
    class="base-input"
    :value="modelValue"
    :placeholder="placeholder"
    :aria-label="ariaLabel"
    type="text"

    @input="
      emit(
        'update:modelValue',
        ($event.target as HTMLInputElement).value
      )
    "

    @keydown="
      emit('keydown', $event)
    "
  />

</template>