export function normalizeStockCode(raw: string): string {
  let code = raw.trim().toUpperCase()
  if (!code.startsWith('HK')) {
    code = 'HK' + code
  }
  const digits = code.replace(/\D/g, '')
  if (digits.length === 0 || digits.length > 5) return ''
  return code
}

export function validateDateRange(start: string, end: string): { valid: boolean; message: string } {
  if (start && end && start > end) {
    return { valid: false, message: '开始日期不能晚于结束日期' }
  }
  return { valid: true, message: '' }
}
