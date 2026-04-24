<template>
  <div class="animate-pulse">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div v-for="i in 6" :key="i" class="bg-white rounded-lg p-6 shadow">
        <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div v-for="i in 5" :key="i" class="h-10 bg-gray-200 rounded mb-2"></div>
    </div>
  </div>
</template>
