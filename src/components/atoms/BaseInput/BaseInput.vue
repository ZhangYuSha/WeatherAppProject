<script setup lang="ts">
import './BaseInput.css'

defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  keydown: [event: KeyboardEvent]
}>()
</script>

<template>

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