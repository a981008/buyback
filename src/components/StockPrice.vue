<template>
  <span class="tblock text-sm font-medium text-gray-700 mb-1">
    股价:
    <span v-if="loading">加载中...</span>
    <span v-else-if="error">--</span>
    <span v-else-if="data">{{ data.price.toFixed(2) }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { fetchStockRealtime } from "../services/buybackService";

const props = defineProps<{
  code: string;
}>();

const loading = ref(false);
const error = ref(false);
const data = ref<{ price: number } | null>(null);

async function loadData() {
  if (!props.code) return;

  loading.value = true;
  error.value = false;

  try {
    data.value = await fetchStockRealtime(props.code);
  } catch (e) {
    error.value = true;
    data.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.code,
  (newCode) => {
    if (newCode) {
      loadData();
    } else {
      data.value = null;
    }
  },
  { immediate: true }
);
</script>
