export interface BuybackRecord {
  date: string
  amount: number
  shares: number
  highPrice: number
  lowPrice: number
  avgPrice: number
}

export interface BuybackSummary {
  totalDays: number
  totalAmount: number
  totalShares: number
  avgPrice: number
  avgPriceStartDate: string
  avgPriceEndDate: string
  maxPrice: number
  maxPriceDate: string
  minPrice: number
  minPriceDate: string
}

export interface BuybackQuery {
  code: string
  startDate?: string
  endDate?: string
}

export interface StockSuggestion {
  code: string
  name: string
}

export interface StockInfo {
  price: number
  marketCap: number
  totalShares: number
}
