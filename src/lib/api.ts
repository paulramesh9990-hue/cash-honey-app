const API_BASE = '/api'

async function fetchJSON<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export async function getDashboardOverview() {
  return fetchJSON<{
    totalBalance: number
    monthlyIncome: number
    monthlyExpenses: number
    savingsRate: number
    netWorth: number
    portfolioValue: number
    portfolioGainLoss: number
    totalGoalTarget: number
    totalGoalCurrent: number
    goalProgress: number
  }>('/dashboard/overview')
}

export async function getSpending() {
  return fetchJSON<{
    totalExpenses: number
    categoryBreakdown: Array<{ name: string; value: number; percentage: number }>
    monthlyTrend: Array<{ month: string; income: number; expense: number }>
  }>('/analytics/spending')
}

export async function getBudgetPerformance() {
  return fetchJSON<{
    budgets: Array<{
      id: string
      category: string
      amount: number
      spent: number
      month: number
      year: number
      percentage: number
      remaining: number
      status: string
    }>
    totalBudgeted: number
    totalSpent: number
    remaining: number
  }>('/analytics/budget-performance')
}

export async function getGoalsProgress() {
  return fetchJSON<{
    goals: Array<{
      id: string
      name: string
      type: string
      targetAmount: number
      currentAmount: number
      deadline: string | null
      priority: string | null
      isCompleted: boolean
      percentage: number
      remaining: number
      daysRemaining: number | null
      monthlyNeeded: number | null
    }>
    totalTarget: number
    totalCurrent: number
    overallProgress: number
  }>('/goals-progress')
}

export async function getPortfolio() {
  return fetchJSON<{
    holdings: Array<{
      id: string
      symbol: string
      name: string
      quantity: number
      avgCost: number
      currentPrice: number
      marketValue: number
      costBasis: number
      gainLoss: number
      gainLossPercent: number
      allocation: number
    }>
    totalValue: number
    totalCost: number
    totalGainLoss: number
    totalGainLossPercent: number
  }>('/analytics/portfolio')
}

export async function getInsights() {
  return fetchJSON<{
    insights: Array<{
      type: string
      title: string
      content: string
      severity: string
    }>
  }>('/ai/insights')
}

export async function getRecommendations() {
  return fetchJSON<{
    recommendations: Array<{
      id: string
      type: string
      title: string
      content: string
      priority: string | null
      isRead: boolean
      createdAt: string
    }>
  }>('/ai/recommendations')
}

export async function getForecast() {
  return fetchJSON<{
    averageMonthly: number
    forecast: Array<{
      month: string
      predicted: number
      optimistic: number
      pessimistic: number
    }>
  }>('/analytics/forecast')
}

export async function sendChat(message: string) {
  return fetchJSON<{ response: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function getTransactions(params?: { page?: number; limit?: number }) {
  const query = params ? `?skip=${(params.page ?? 0) * (params.limit ?? 20)}&take=${params.limit ?? 20}` : ''
  return fetchJSON<{
    items: Array<{
      id: string
      amount: number
      type: string
      category: string
      description: string | null
      date: string
      accountId: string
    }>
    total: number
  }>(`/transactions${query}`)
}

export async function createTransaction(data: {
  userId: string
  accountId: string
  amount: number
  type: string
  category: string
  description?: string
  date?: string
}) {
  return fetchJSON('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getMe() {
  return fetchJSON<{ user: { id: string; name: string | null; email: string; monthlyIncome: number | null; riskTolerance: string | null } }>('/auth/me')
}
