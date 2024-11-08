export const CREDIT_TRANSACTION_TYPE = ['purchase', 'spend', 'refund', 'manual', 'coupon'] as const
export type CreditTransactionType = (typeof CREDIT_TRANSACTION_TYPE)[number]

export const CREDIT_TRANSACTION_STATUS = ['pending', 'completed', 'failed'] as const
export type CreditTransactionStatus = (typeof CREDIT_TRANSACTION_STATUS)[number]
