<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th @click="toggleSort('date')" class="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none">
              回购日期 {{ sortIcon('date') }}
            </th>
            <th @click="toggleSort('shares')" class="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none">
              回购股数(万股) {{ sortIcon('shares') }}
            </th>
            <th @click="toggleSort('amount')" class="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none">
              回购金额(万元) {{ sortIcon('amount') }}
            </th>
            <th @click="toggleSort('highPrice')" class="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none">
              最高价 {{ sortIcon('highPrice') }}
            </th>
            <th @click="toggleSort('lowPrice')" class="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none">
              最低价 {{ sortIcon('lowPrice') }}
            </th>
            <th @click="toggleSort('avgPrice')" class="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none">
              均价 {{ sortIcon('avgPrice') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in sortedRecords" :key="i" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-900">{{ r.date }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ fmtNum(r.shares) }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ fmtMoney(r.amount) }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ fmtMoney(r.highPrice) }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ fmtMoney(r.lowPrice) }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ fmtMoney(r.avgPrice) }}</td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-gray-400">暂无回购记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BuybackRecord } from '../types/buyback'
import { formatNumber, formatMoney } from '../utils/format'

const props = defineProps<{ records: BuybackRecord[] }>()

type SortKey = keyof BuybackRecord
const sortKey = ref<SortKey>('date')
const sortAsc = ref(false)

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = key === 'date'
  }
}

function sortIcon(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortAsc.value ? '▲' : '▼'
}

const sortedRecords = computed(() => {
  const arr = [...props.records]
  arr.sort((a, b) => {
    const va = a[sortKey.value]
    const vb = b[sortKey.value]
    const cmp = typeof va === 'number' ? (va as number) - (vb as number) : String(va).localeCompare(String(vb))
    return sortAsc.value ? cmp : -cmp
  })
  return arr
})

function fmtNum(n: number) { return formatNumber(n) }
function fmtMoney(n: number) { return formatMoney(n) }
</script>
