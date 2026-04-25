import type { BuybackRecord, BuybackQuery, BuybackSummary, StockSuggestion } from '../types/buyback'

export class BuybackApiError extends Error {
  constructor(
    public readonly type: 'NETWORK' | 'HTTP_ERROR' | 'PARSE_ERROR' | 'TIMEOUT',
    public readonly userMessage: string,
    public readonly statusCode?: number
  ) {
    super(userMessage)
  }
}

function parseHtmlTable(html: string): BuybackRecord[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const rows = doc.querySelectorAll('#purchase table tbody tr')
  const records: BuybackRecord[] = []

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td')
    if (cells.length < 6) return

    const date = cells[1].textContent?.trim() || ''  // 回购日期
    const amountWan = parseFloat(cells[2].textContent?.trim() || '0')  // 回购金额(万元)
    const sharesWan = parseFloat(cells[3].textContent?.trim() || '0')  // 回购数量(万股)
    const high = parseFloat(cells[4].textContent?.trim() || '0')  // 最高价(元)
    const low = parseFloat(cells[5].textContent?.trim() || '0')   // 最低价(元)

    if (!date) return

    const amount = amountWan
    const shares = sharesWan 
    const avg = shares ? amount / shares : 0

    records.push({ date, amount, shares, highPrice: high, lowPrice: low, avgPrice: avg })
  })

  return records
}

export async function fetchBuybackData(query: BuybackQuery): Promise<BuybackRecord[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const resp = await fetch(
      `https://basic.10jqka.com.cn/176/${query.code}/equity.html`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html, */*',
          'Referer': 'https://stockpage.10jqka.com.cn/'
        }
      }
    )
    clearTimeout(timeoutId)

    if (!resp.ok) {
      if (resp.status === 404) return []
      throw new BuybackApiError('HTTP_ERROR', `服务器返回错误(${resp.status})`, resp.status)
    }

    const html = await resp.text()
    const records = parseHtmlTable(html)
    return filterAndSort(records, query)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof BuybackApiError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new BuybackApiError('TIMEOUT', '请求超时，请稍后重试')
    }
    throw new BuybackApiError('NETWORK', '网络连接失败，请检查网络后重试')
  }
}

function filterAndSort(records: BuybackRecord[], query: BuybackQuery): BuybackRecord[] {
  let result = records
  if (query.startDate) result = result.filter(r => r.date >= query.startDate!)
  if (query.endDate) result = result.filter(r => r.date <= query.endDate!)
  result.sort((a, b) => b.date.localeCompare(a.date))
  return result
}

export function computeSummary(records: BuybackRecord[]): BuybackSummary {
  if (records.length === 0) {
    return { totalDays: 0, totalAmount: 0, totalShares: 0, avgPrice: 0, avgPriceStartDate: '', avgPriceEndDate: '', maxPrice: 0, maxPriceDate: '', minPrice: 0, minPriceDate: '' }
  }
  const totalDays = records.length
  const totalAmount = records.reduce((s, r) => s + r.amount, 0)
  const totalShares = records.reduce((s, r) => s + r.shares, 0)
  const avgPrice = totalShares ? totalAmount / totalShares : 0

  let maxRecord = records[0]
  let minRecord = records[0]
  for (const r of records) {
    if (r.highPrice >= maxRecord.highPrice) maxRecord = r
    if (r.lowPrice <= minRecord.lowPrice) minRecord = r
  }

  // 按日期排序获取最早和最晚日期
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalDays,
    totalAmount,
    totalShares,
    avgPrice,
    avgPriceStartDate: sortedRecords[0].date,
    avgPriceEndDate: sortedRecords[sortedRecords.length - 1].date,
    maxPrice: maxRecord.highPrice,
    maxPriceDate: maxRecord.date,
    minPrice: minRecord.lowPrice,
    minPriceDate: minRecord.date
  }
}

export async function searchStock(keyword: string): Promise<StockSuggestion[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const resp = await fetch(
      `https://news.10jqka.com.cn/public/index_keyboard_${encodeURIComponent(keyword)}_hk_5_jsonp.html`,
      {
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'Referer': 'https://news.10jqka.com.cn/'
        }
      }
    )

    clearTimeout(timeoutId)

    if (!resp.ok) return []

    const text = await resp.text()

    const match = text.trim().match(/^jsonp\((.+)\);?\s*$/s)
    if (!match) return []

    const data: string[] = JSON.parse(match[1])

    return data
      .map(item => {
        // "6||01810 小米集团-W xmjt-w 港股"
        const parts = item.split('||')
        if (parts.length < 2) return null

        const fields = parts[1].trim().split(' ')
        if (fields.length < 2) return null

        const rawCode = fields[0]

        // ❗ 过滤：只保留 0 开头的正股
        if (!rawCode.startsWith('0')) return null

        // ✔ 统一 4 位港股代码（核心修正）
        const code = formatHKCode(rawCode)

        const name = fields[1]

        return {
          code,
          name
        }
      })
      .filter((s): s is StockSuggestion => s !== null)

  } catch {
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}

function formatHKCode(raw: string): string {
  // 去掉 HK 前缀（如果有）
  let v = raw.replace(/^HK/i, '')

  // 只保留数字
  if (!/^\d+$/.test(v)) return raw

  // 超长取最后4位
  if (v.length > 4) {
    v = v.slice(-4)
  }

  // 不足补0到4位
  v = v.padStart(4, '0')

  return 'HK' + v
}

export interface StockRealtimeData {
  price: number       // 当前价格
  changePercent: number  // 涨跌幅百分比
  changeAbsolute: number  // 涨跌幅绝对值
}

export interface StockInfo {
  price: number       // 当前价格
  marketCap: number   // 总市值（元）
  totalShares: number // 总股本（万股）
}

export async function fetchStockRealtime(code: string): Promise<StockRealtimeData> {
  // code 格式: HK3888，URL格式: hk_HK3888
  return new Promise((resolve, reject) => {
    const callbackName = `quotebridge_v6_realhead_hk_${code}_defer_last`

    const script = document.createElement('script')
    script.src = `https://d.10jqka.com.cn/v6/realhead/hk_${code}/defer/last.js`

    const timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('请求超时'))
    }, 5000)

    function cleanup() {
      clearTimeout(timeoutId)
      delete (window as any)[callbackName]
      document.head.removeChild(script)
    }

    (window as any)[callbackName] = (data: any) => {
      cleanup()
      const items = data.items
      const price = parseFloat(items['10']) || 0  // 当前价格
      const changePercent = parseFloat(items['199112']) || 0  // 涨跌幅百分比
      const changeAbsolute = parseFloat(items['264648']) || 0  // 涨跌幅绝对值
      resolve({ price, changePercent, changeAbsolute })
    }

    script.onerror = () => {
      cleanup()
      reject(new Error('网络请求失败'))
    }

    document.head.appendChild(script)
  })
}

export async function fetchStockInfo(code: string): Promise<StockInfo> {
  return new Promise((resolve, reject) => {
    const callbackName = `quotebridge_v6_realhead_hk_${code}_defer_last`

    const script = document.createElement('script')
    script.src = `https://d.10jqka.com.cn/v6/realhead/hk_${code}/defer/last.js`

    const timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('请求超时'))
    }, 5000)

    function cleanup() {
      clearTimeout(timeoutId)
      delete (window as any)[callbackName]
      document.head.removeChild(script)
    }

    ;(window as any)[callbackName] = (data: any) => {
      cleanup()
      const items = data.items
      const price = parseFloat(items['10']) || 0  // 当前价格
      const marketCap = parseFloat(items['3475914']) || 0  // 总市值
      const totalShares = price ? marketCap / price : 0  // 总股本
      resolve({ price, marketCap, totalShares })
    }

    script.onerror = () => {
      cleanup()
      reject(new Error('网络请求失败'))
    }

    document.head.appendChild(script)
  })
}