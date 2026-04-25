import { ref, computed } from 'vue'
import type { BuybackRecord, BuybackSummary, StockInfo } from '../types/buyback'
import { fetchBuybackData, fetchStockInfo, computeSummary, BuybackApiError } from '../services/buybackService'
import { normalizeStockCode, validateDateRange } from '../utils/validation'

export function useBuyback() {
  const stockCode = ref('')
  const startDate = ref('')
  const endDate = ref('')
  const records = ref<BuybackRecord[]>([])
  const summary = ref<BuybackSummary | null>(null)
  const stockInfo = ref<StockInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasQueried = ref(false)

  const dateError = computed(() => {
    const result = validateDateRange(startDate.value, endDate.value)
    return result.valid ? '' : result.message
  })

  const isValid = computed(() => {
    return stockCode.value.trim().length > 0 && !dateError.value
  })

  async function query() {
    if (!isValid.value) {
      error.value = stockCode.value.trim() ? '请选择有效的日期范围' : '请输入有效的股票代码'
      return
    }

    isLoading.value = true
    error.value = null
    hasQueried.value = true

    try {
      const code = normalizeStockCode(stockCode.value)
      if (!code) {
        error.value = '请输入有效的港股代码'
        records.value = []
        summary.value = null
        return
      }

      const data = await fetchBuybackData({
        code,
        startDate: startDate.value || undefined,
        endDate: endDate.value || undefined
      })

      records.value = data
      summary.value = computeSummary(data)

      try {
        stockInfo.value = await fetchStockInfo(code)
      } catch {
        stockInfo.value = null
      }

      if (data.length === 0) {
        error.value = '未找到该股票的回购数据'
      }
    } catch (e) {
      if (e instanceof BuybackApiError) {
        error.value = e.userMessage
      } else {
        error.value = '查询失败，请稍后重试'
      }
      records.value = []
      summary.value = null
    } finally {
      isLoading.value = false
    }
  }

  return {
    stockCode,
    startDate,
    endDate,
    records,
    summary,
    stockInfo,
    isLoading,
    error,
    hasQueried,
    isValid,
    dateError,
    query
  }
}
