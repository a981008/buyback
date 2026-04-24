<template>
  <div
    :class="[
      'rounded-lg p-6 text-center',
      type === 'not_found' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
    ]"
  >
    <p class="text-lg mb-3">{{ message }}</p>
    <button
      v-if="type !== 'not_found'"
      @click="$emit('retry')"
      class="px-4 py-2 rounded-md font-medium transition-colors"
      :class="type === 'error' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'"
    >
      重试
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  type: 'not_found' | 'error'
}>()

defineEmits<{
  retry: []
}>()
</script>
