<template>
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex flex-wrap items-end gap-4">

      <!-- 股票输入 -->
      <div class="flex-1 min-w-[200px] relative">
        <div class="flex items-center gap-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            股票代码/名称 <span class="text-red-500">*</span>
          </label>
        </div>

        <input
          v-model="stockDisplay"
          type="text"
          placeholder="输入代码或名称，如 1810、小米"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          autocomplete="off"
          @input="onInput"
          @keydown="onKeydown"
          @focus="onFocus"
          @blur="onBlur"
        />

        <!-- 下拉 -->
        <ul
          v-if="showDropdown && suggestions.length > 0"
          class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow max-h-60 overflow-y-auto"
        >
          <li
            v-for="(s, i) in suggestions"
            :key="s.code"
            :class="[
              'px-3 py-2 cursor-pointer flex justify-between text-sm hover:bg-blue-50',
              i === highlightIndex ? 'bg-blue-100' : ''
            ]"
            @mousedown.prevent="select(s)"
          >
            <span class="font-medium text-gray-900">{{ s.code }}</span>
            <span class="text-gray-500">{{ s.name }}</span>
          </li>
        </ul>
      </div>

      <!-- 日期快捷选择 -->
      <div>
        <label class="block text-sm text-gray-700 mb-1">日期范围</label>
        <select
          v-model="datePreset"
          class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">所有</option>
          <option value="week">这周以来</option>
          <option value="month">这月以来</option>
          <option value="year">今年以来</option>
          <option value="7">最近一周</option>
          <option value="30">最近一个月</option>
          <option value="365">最近一年</option>
          <option v-if="datePreset === 'custom'" value="custom">自定义</option>
        </select>
      </div>

      <!-- 开始日期 -->
      <div>
        <label class="block text-sm text-gray-700 mb-1">开始日期</label>
        <input v-model="start" type="date"
          class="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"/>
      </div>

      <div>
        <label class="block text-sm text-gray-700 mb-1">结束日期</label>
        <input v-model="end" type="date"
          class="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"/>
      </div>

      <!-- 查询按钮 -->
      <button
        @click="doQuery"
        :disabled="!valid || loading"
        class="px-6 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 disabled:opacity-50"
      >
        {{ loading ? '查询中...' : '查询' }}
      </button>

    </div>

    <p v-if="dateErr" class="mt-2 text-sm text-red-600">{{ dateErr }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { searchStock } from '../services/buybackService'
import type { StockSuggestion } from '../types/buyback'

/**
 * =========================
 * Props / Emits
 * =========================
 */
const props = defineProps<{
  modelValue: string
  startModel: string
  endModel: string
  valid: boolean
  loading: boolean
  dateErr: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: string]
  'update:startModel': [v: string]
  'update:endModel': [v: string]
  query: []
}>()

/**
 * =========================
 * HK 代码标准化
 * =========================
 */
function formatHKCode(raw: string): string {
  let v = raw.replace(/^HK/i, '')

  if (!/^\d+$/.test(v)) return raw

  // 超过4位取最后4位
  if (v.length > 4) v = v.slice(-4)

  // 不足补0
  v = v.padStart(4, '0')

  return 'HK' + v
}

/**
 * =========================
 * 日期快捷选择
 * =========================
 */
const datePreset = ref('all') // 默认所有

// 预设日期范围计算
function calcPresetRange(preset: string | number) {
  const end = new Date()
  let start = new Date()

  if (preset === 'week') {
    // 这周以来：从本周一到现在
    const day = start.getDay()
    const diff = day === 0 ? 6 : day - 1 // 周一为起点
    start.setDate(start.getDate() - diff)
  } else if (preset === 'month') {
    // 这月以来：从本月1号到现在
    start.setDate(1)
  } else if (preset === 'year') {
    // 今年以来：从今年1月1号到现在
    start.setMonth(0, 1)
  } else {
    // 按天数往前推
    const days = parseInt(String(preset))
    start.setDate(start.getDate() - days)
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

// 初始化：设置默认日期范围
onMounted(() => {
  const range = calcPresetRange('30')
  emit('update:startModel', range.start)
  emit('update:endModel', range.end)
})

// 当选择快捷选项时，自动计算日期范围
watch(datePreset, (preset) => {
  if (preset === 'custom') return

  if (preset === 'all') {
    // 所有：不设置日期过滤
    emit('update:startModel', '')
    emit('update:endModel', '')
  } else {
    const range = calcPresetRange(preset)
    emit('update:startModel', range.start)
    emit('update:endModel', range.end)
  }

  // 日期选择完后，如果股票代码不为空就自动查询
  if (stockCode.value) {
    doQuery()
  }
})

// 当手动修改日期时，切换到自定义模式
watch(
  () => props.startModel,
  (newStart, oldStart) => {
    if (!newStart || datePreset.value === 'custom') return
    if (newStart === oldStart) return

    const current = datePreset.value
    if (current === 'all') {
      datePreset.value = 'custom'
      return
    }

    const days = parseInt(current)
    if (isNaN(days)) return

    const range = calcPresetRange(days)
    if (newStart !== range.start || props.endModel !== range.end) {
      datePreset.value = 'custom'
    }
  }
)

watch(
  () => props.endModel,
  (newEnd, oldEnd) => {
    if (!newEnd || datePreset.value === 'custom') return
    if (newEnd === oldEnd) return

    const current = datePreset.value
    if (current === 'all') {
      datePreset.value = 'custom'
      return
    }

    const days = parseInt(current)
    if (isNaN(days)) return

    const range = calcPresetRange(days)
    if (props.startModel !== range.start || newEnd !== range.end) {
      datePreset.value = 'custom'
    }
  }
)

/**
 * =========================
 * 状态拆分
 * =========================
 */
const stockCode = ref(props.modelValue)
const stockDisplay = ref('')

const start = computed({
  get: () => props.startModel,
  set: (v) => emit('update:startModel', v)
})

const end = computed({
  get: () => props.endModel,
  set: (v) => emit('update:endModel', v)
})

/**
 * =========================
 * 下拉逻辑
 * =========================
 */
const suggestions = ref<StockSuggestion[]>([])
const showDropdown = ref(false)
const highlightIndex = ref(-1)

let timer: ReturnType<typeof setTimeout> | null = null

function onInput(e: Event) {
  const kw = (e.target as HTMLInputElement).value.trim()

  if (!kw) {
    suggestions.value = []
    showDropdown.value = false
    return
  }

  if (timer) clearTimeout(timer)

  timer = setTimeout(async () => {
    suggestions.value = await searchStock(kw)
    showDropdown.value = suggestions.value.length > 0
    highlightIndex.value = -1
  }, 300)
}

/**
 * =========================
 * 选择股票
 * =========================
 */
function select(s: StockSuggestion) {
  stockCode.value = s.code
  stockDisplay.value = `${s.code} - ${s.name}`

  suggestions.value = []
  showDropdown.value = false

  doQuery()
}

/**
 * =========================
 * 查询
 * =========================
 */
function doQuery() {
  showDropdown.value = false
  emit('update:modelValue', stockCode.value)
  emit('query')
}

/**
 * =========================
 * 键盘操作
 * =========================
 */
function onKeydown(e: KeyboardEvent) {
  if (!showDropdown.value || suggestions.value.length === 0) {
    if (e.key === 'Enter') doQuery()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = Math.min(highlightIndex.value + 1, suggestions.value.length - 1)
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(highlightIndex.value - 1, -1)
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightIndex.value >= 0) {
      select(suggestions.value[highlightIndex.value])
    } else {
      select(suggestions.value[0])
    }
  }

  if (e.key === 'Escape') {
    showDropdown.value = false
  }
}

/**
 * =========================
 * UI 控制
 * =========================
 */
function onFocus() {
  if (suggestions.value.length > 0) {
    showDropdown.value = true
  }
}

function onBlur() {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

/**
 * =========================
 * 外部同步
 * =========================
 */
watch(
  () => props.modelValue,
  (v) => {
    stockCode.value = v
  }
)
</script>