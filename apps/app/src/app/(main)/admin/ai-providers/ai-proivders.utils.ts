import { formatCurrency } from '@bulkit/shared/utils/string'

export function calculateCostPerMillion(creditCost: number, currency: string) {
  // 1 credit = 0.01 currency = 1 cent
  return formatCurrency(creditCost * 1_000_000, currency)
}
