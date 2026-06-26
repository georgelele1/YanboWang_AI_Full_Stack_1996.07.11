export const BILLING_PLANS = {
  free_trial: {
    id: 'free_trial',
    amountCents: 0,
    intervalDays: 3,
    isPaid: false,
  },
  weekly: {
    id: 'weekly',
    amountCents: 499,
    intervalDays: 7,
    isPaid: true,
  },
  monthly: {
    id: 'monthly',
    amountCents: 999,
    intervalMonths: 1,
    isPaid: true,
  },
  yearly: {
    id: 'yearly',
    amountCents: 5988,
    intervalYears: 1,
    isPaid: true,
  },
} as const

export type BillingPlanId = keyof typeof BILLING_PLANS

export function normalizeBillingPlan(plan: unknown): BillingPlanId {
  return typeof plan === 'string' && plan in BILLING_PLANS ? plan as BillingPlanId : 'monthly'
}

export function isFreeTrialPlan(plan: BillingPlanId) {
  return plan === 'free_trial'
}

export function getPlanExpiresAt(plan: BillingPlanId, from = new Date()) {
  const expiresAt = new Date(from)
  const config = BILLING_PLANS[plan]

  if ('intervalYears' in config) expiresAt.setFullYear(expiresAt.getFullYear() + config.intervalYears)
  else if ('intervalMonths' in config) expiresAt.setMonth(expiresAt.getMonth() + config.intervalMonths)
  else expiresAt.setDate(expiresAt.getDate() + config.intervalDays)

  return expiresAt
}
