<template>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">回购天数</div>
      <div class="text-2xl font-bold text-gray-900">{{ summary.totalDays }} <span class="text-sm font-normal text-gray-400">天</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">回购总金额</div>
      <div class="text-2xl font-bold text-gray-900">{{ fmtNum(summary.totalAmount) }} <span class="text-sm font-normal text-gray-400">万元</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">回购总股数</div>
      <div class="text-2xl font-bold text-gray-900">{{ fmtNum(summary.totalShares) }} <span class="text-sm font-normal text-gray-400">万股</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">平均回购价格</div>
      <div class="text-2xl font-bold text-gray-900">{{ fmtMoney(summary.avgPrice) }} <span class="text-sm font-normal text-gray-400">HKD</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">最高回购价格</div>
      <div class="text-2xl font-bold text-gray-900">{{ fmtMoney(summary.maxPrice) }} <span class="text-sm font-normal text-gray-400">HKD</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">最低回购价格</div>
      <div class="text-2xl font-bold text-gray-900">{{ fmtMoney(summary.minPrice) }} <span class="text-sm font-normal text-gray-400">HKD</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">当前股价</div>
      <div class="text-2xl font-bold text-gray-900">{{ stockInfo ? fmtMoney(stockInfo.price) : '--' }} <span class="text-sm font-normal text-gray-400">HKD</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">总市值</div>
      <div class="text-2xl font-bold text-gray-900">{{ stockInfo ? fmtYi(stockInfo.marketCap) : '--' }} <span class="text-sm font-normal text-gray-400">亿元</span></div>
    </div>
    <div class="bg-white rounded-lg shadow p-5">
      <div class="text-sm text-gray-500 mb-1">总股本</div>
      <div class="text-2xl font-bold text-gray-900">{{ stockInfo ? fmtYi(stockInfo.totalShares) : '--' }} <span class="text-sm font-normal text-gray-400">亿股</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BuybackSummary as Summary, StockInfo } from '../types/buyback'
import { formatNumber, formatMoney } from '../utils/format'

defineProps<{ summary: Summary; stockInfo: StockInfo | null }>()

function fmtNum(n: number) { return formatNumber(n) }
function fmtMoney(n: number) { return formatMoney(n) }
function fmtYi(n: number) {
  return formatNumber(n / 1e8, 2)
}
</script>
