<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <header class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">港股股票回购查询</h1>
      <p class="text-gray-500">查询香港上市公司股票回购数据</p>
    </header>

    <BuybackForm
      v-model="stockCode"
      v-model:start-model="startDate"
      v-model:end-model="endDate"
      :valid="isValid"
      :loading="isLoading"
      :date-err="dateError"
      @query="query"
    />

    <LoadingSkeleton v-if="isLoading" />

    <template v-if="!isLoading && hasQueried">
      <ErrorMessage
        v-if="error"
        :message="error"
        :type="records.length === 0 && error.includes('未找到') ? 'not_found' : 'error'"
        @retry="query"
      />

      <template v-if="summary && records.length > 0">
        <BuybackSummary :summary="summary" :stock-info="stockInfo" />
        <BuybackTable :records="records" />
      </template>
    </template>

    <EmptyState v-if="!isLoading && !hasQueried" />

    <footer class="text-center mt-12 text-sm text-gray-400">
      数据来源于第三方接口，仅供参考
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useBuyback } from './composables/useBuyback'
import BuybackForm from './components/BuybackForm.vue'
import BuybackSummary from './components/BuybackSummary.vue'
import BuybackTable from './components/BuybackTable.vue'
import ErrorMessage from './components/ErrorMessage.vue'
import LoadingSkeleton from './components/LoadingSkeleton.vue'
import EmptyState from './components/EmptyState.vue'

const {
  stockCode, startDate, endDate,
  records, summary, stockInfo, isLoading, error,
  hasQueried, isValid, dateError, query
} = useBuyback()
</script>
