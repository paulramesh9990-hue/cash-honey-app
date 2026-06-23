// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { Hono } from 'hono'
import { prisma } from './src/lib/db'

const app = new Hono()

async function resolveUserId(provided?: string): Promise<string> {
  if (provided && provided !== 'default') return provided
  const user = await prisma.user.findFirst()
  return user?.id ?? 'default'
}

app.get('/auth/me', async (c) => {
  const user = await prisma.user.findFirst()
  if (!user) return c.json({ error: 'No user found' }, 404)
  return c.json({ user })
})

// ─── Dashboard Overview ───────────────────────────────────────
app.get('/dashboard/overview', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))

  const [accounts, recentTransactions, budgets, goals, portfolios] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.budget.findMany({ where: { userId, month: new Date().getMonth() + 1, year: new Date().getFullYear() } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.portfolio.findMany({ where: { userId } }),
  ])

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const monthlyIncome = recentTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthlyExpenses = recentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0

  const portfolioValue = portfolios.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0)
  const portfolioCost = portfolios.reduce((sum, p) => sum + p.quantity * p.avgCost, 0)

  const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0)

  return c.json({
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate: Math.round(savingsRate * 100) / 100,
    netWorth: totalBalance + portfolioValue,
    portfolioValue,
    portfolioGainLoss: portfolioValue - portfolioCost,
    totalGoalTarget,
    totalGoalCurrent,
    goalProgress: totalGoalTarget > 0 ? Math.round((totalGoalCurrent / totalGoalTarget) * 10000) / 100 : 0,
  })
})

// ─── Spending Analysis ────────────────────────────────────────
app.get('/analytics/spending', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 6)

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startDate }, type: 'expense' },
    orderBy: { date: 'asc' },
  })

  const byCategory: Record<string, number> = {}
  const byMonth: Record<string, { income: number; expense: number }> = {}

  for (const t of transactions) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 }
    byMonth[key].expense += t.amount
  }

  const incomeTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startDate }, type: 'income' },
    orderBy: { date: 'asc' },
  })

  for (const t of incomeTransactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 }
    byMonth[key].income += t.amount
  }

  const totalExpenses = transactions.reduce((s, t) => s + t.amount, 0)
  const categoryBreakdown = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value, percentage: totalExpenses > 0 ? Math.round((value / totalExpenses) * 10000) / 100 : 0 }))
    .sort((a, b) => b.value - a.value)

  const monthlyTrend = Object.entries(byMonth)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return c.json({ totalExpenses, categoryBreakdown, monthlyTrend })
})

// ─── Budget Performance ───────────────────────────────────────
app.get('/analytics/budget-performance', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))
  const now = new Date()

  const budgets = await prisma.budget.findMany({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
  })

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: currentMonthStart, lte: currentMonthEnd },
    },
  })

  const spentByCategory: Record<string, number> = {}
  for (const e of expenses) {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount
  }

  const performance = budgets.map((b) => {
    const spent = spentByCategory[b.category] || 0
    const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 10000) / 100 : 0
    const remaining = Math.max(b.amount - spent, 0)
    const status = percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'on-track'

    return { ...b, spent, percentage, remaining, status }
  })

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  return c.json({ budgets: performance, totalBudgeted, totalSpent, remaining: totalBudgeted - totalSpent })
})

// ─── Goals Progress ───────────────────────────────────────────
app.get('/goals-progress', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = goals.map((g) => {
    const percentage = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 10000) / 100 : 0
    const remaining = g.targetAmount - g.currentAmount
    const daysRemaining = g.deadline
      ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null
    const monthlyNeeded = daysRemaining && daysRemaining > 0
      ? Math.ceil(remaining / (daysRemaining / 30))
      : null

    return { ...g, percentage, remaining, daysRemaining, monthlyNeeded }
  })

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0)

  return c.json({
    goals: enriched,
    totalTarget,
    totalCurrent,
    overallProgress: totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 10000) / 100 : 0,
  })
})

// ─── Recommendations ──────────────────────────────────────────
app.get('/ai/recommendations', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))

  const recs = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 20,
  })

  return c.json({ recommendations: recs })
})

app.post('/ai/recommendations/:id/read', async (c) => {
  const id = c.req.param('id')
  await prisma.recommendation.update({ where: { id }, data: { isRead: true } })
  return c.json({ ok: true })
})

// ─── AI Insights Engine ───────────────────────────────────────
app.get('/ai/insights', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const monthStart = new Date(currentYear, now.getMonth(), 1)
  const monthEnd = new Date(currentYear, now.getMonth() + 1, 0)
  const prevMonthStart = new Date(currentYear, now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(currentYear, now.getMonth(), 0)

  const [currentExpenses, prevExpenses, budgets, goals, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: prevMonthStart, lte: prevMonthEnd } },
    }),
    prisma.budget.findMany({ where: { userId, month: currentMonth, year: currentYear } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ])

  const insights: Array<{ type: string; title: string; content: string; severity: string }> = []

  const currentTotal = currentExpenses.reduce((s, t) => s + t.amount, 0)
  const prevTotal = prevExpenses.reduce((s, t) => s + t.amount, 0)
  const changePercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0

  if (changePercent > 15) {
    insights.push({
      type: 'spending',
      title: 'Spending Increased Significantly',
      content: `Your expenses are up ${changePercent.toFixed(1)}% compared to last month ($${currentTotal.toFixed(2)} vs $${prevTotal.toFixed(2)}). Review your recent transactions to identify areas where you can cut back.`,
      severity: 'warning',
    })
  } else if (changePercent < -10) {
    insights.push({
      type: 'spending',
      title: 'Great Spending Reduction',
      content: `Your expenses decreased by ${Math.abs(changePercent).toFixed(1)}% this month! You saved $${(prevTotal - currentTotal).toFixed(2)} compared to last month.`,
      severity: 'success',
    })
  }

  for (const budget of budgets) {
    const spent = currentExpenses
      .filter((t) => t.category === budget.category)
      .reduce((s, t) => s + t.amount, 0)
    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

    if (pct >= 100) {
      insights.push({
        type: 'budget',
        title: `${budget.category} Budget Exceeded`,
        content: `You've spent $${spent.toFixed(2)} of your $${budget.amount.toFixed(2)} ${budget.category} budget (${pct.toFixed(0)}%). Consider reducing ${budget.category.toLowerCase()} spending for the rest of the month.`,
        severity: 'danger',
      })
    } else if (pct >= 80) {
      insights.push({
        type: 'budget',
        title: `${budget.category} Budget Approaching Limit`,
        content: `You've used ${pct.toFixed(0)}% of your ${budget.category} budget with $${(budget.amount - spent).toFixed(2)} remaining. Be mindful of upcoming ${budget.category.toLowerCase()} expenses.`,
        severity: 'warning',
      })
    }
  }

  for (const goal of goals) {
    if (goal.isCompleted) continue
    if (!goal.deadline) continue
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const remaining = goal.targetAmount - goal.currentAmount

    if (daysLeft <= 30 && remaining > 0) {
      const dailyNeeded = remaining / daysLeft
      insights.push({
        type: 'goal',
        title: `${goal.name} Deadline Approaching`,
        content: `Only ${daysLeft} days left to reach your ${goal.name} goal. You need $${remaining.toFixed(2)} more ($${dailyNeeded.toFixed(2)}/day). Consider increasing contributions or adjusting the deadline.`,
        severity: 'warning',
      })
    } else if (daysLeft > 60) {
      const monthlyNeeded = remaining / (daysLeft / 30)
      insights.push({
        type: 'goal',
        title: `${goal.name} On Track`,
        content: `Your ${goal.name} goal is ${((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}% complete. At $${monthlyNeeded.toFixed(2)}/month, you'll reach your target by the deadline.`,
        severity: 'success',
      })
    }
  }

  const totalSpentByCategory: Record<string, number> = {}
  for (const t of currentExpenses) {
    totalSpentByCategory[t.category] = (totalSpentByCategory[t.category] || 0) + t.amount
  }
  const topCategory = Object.entries(totalSpentByCategory).sort((a, b) => b[1] - a[1])[0]
  if (topCategory) {
    insights.push({
      type: 'spending',
      title: `Top Spending: ${topCategory[0]}`,
      content: `${topCategory[0]} accounts for $${topCategory[1].toFixed(2)} (${((topCategory[1] / currentTotal) * 100).toFixed(0)}%) of your monthly expenses. This is your biggest area of spending.`,
      severity: 'info',
    })
  }

  if (user?.monthlyIncome) {
    const savingsRate = ((user.monthlyIncome - currentTotal) / user.monthlyIncome) * 100
    if (savingsRate < 20) {
      insights.push({
        type: 'savings',
        title: 'Savings Rate Below Target',
        content: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income. Consider reducing expenses or increasing income.`,
        severity: 'warning',
      })
    } else {
      insights.push({
        type: 'savings',
        title: 'Healthy Savings Rate',
        content: `Your savings rate is ${savingsRate.toFixed(1)}% — well above the 20% target. You're building a strong financial foundation!`,
        severity: 'success',
      })
    }
  }

  return c.json({ insights })
})

// ─── Spending Forecast ────────────────────────────────────────
app.get('/analytics/forecast', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: 'expense', date: { gte: threeMonthsAgo } },
    orderBy: { date: 'asc' },
  })

  const byMonth: Record<string, number> = {}
  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    byMonth[key] = (byMonth[key] || 0) + t.amount
  }

  const monthlyExpenses = Object.values(byMonth)
  const avgMonthly = monthlyExpenses.length > 0
    ? monthlyExpenses.reduce((s, v) => s + v, 0) / monthlyExpenses.length
    : 0

  const forecast: Array<{ month: string; predicted: number; optimistic: number; pessimistic: number }> = []
  const now = new Date()
  for (let i = 1; i <= 6; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
    forecast.push({
      month: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
      predicted: Math.round(avgMonthly * (1 + (i * 0.02)) * 100) / 100,
      optimistic: Math.round(avgMonthly * 0.9 * 100) / 100,
      pessimistic: Math.round(avgMonthly * 1.15 * 100) / 100,
    })
  }

  return c.json({ averageMonthly: avgMonthly, forecast })
})

// ─── Portfolio Analytics ──────────────────────────────────────
app.get('/analytics/portfolio', async (c) => {
  const userId = await resolveUserId(c.req.query('userId'))

  const holdings = await prisma.portfolio.findMany({ where: { userId } })

  const totalValue = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0)
  const totalCost = holdings.reduce((s, h) => s + h.quantity * h.avgCost, 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  const enriched = holdings.map((h) => {
    const marketValue = h.quantity * h.currentPrice
    const costBasis = h.quantity * h.avgCost
    const gainLoss = marketValue - costBasis
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0
    const allocation = totalValue > 0 ? (marketValue / totalValue) * 100 : 0

    return {
      ...h,
      marketValue,
      costBasis,
      gainLoss,
      gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      allocation: Math.round(allocation * 100) / 100,
    }
  })

  return c.json({
    holdings: enriched,
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
  })
})

// ─── Chat / AI Advisor ────────────────────────────────────────
app.post('/ai/chat', async (c) => {
  const body = await c.req.json()
  const { message, userId } = body

  if (!message) return c.json({ error: 'message is required' }, 400)

  const uid = await resolveUserId(userId || undefined)

  const [spending, income, goals, budgets, holdings, accounts, recommendations, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: uid, type: 'expense' },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.transaction.findMany({
      where: { userId: uid, type: 'income' },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.goal.findMany({ where: { userId: uid } }),
    prisma.budget.findMany({ where: { userId: uid } }),
    prisma.portfolio.findMany({ where: { userId: uid } }),
    prisma.account.findMany({ where: { userId: uid } }),
    prisma.recommendation.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.user.findUnique({ where: { id: uid } }),
  ])

  const totalExpenses = spending.reduce((s, t) => s + t.amount, 0)
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const portfolioValue = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0)
  const portfolioCost = holdings.reduce((s, h) => s + h.quantity * h.avgCost, 0)

  const byCategory: Record<string, number> = {}
  for (const t of spending) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
  }

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(', ')

  const recentTransactions = spending.slice(0, 10)
    .map((t) => `${t.date.toISOString().split('T')[0]}: ${t.description || t.category} -$${t.amount.toFixed(2)}`)
    .join('\n')

  const goalsSummary = goals
    .map((g) => {
      const pct = ((g.currentAmount / g.targetAmount) * 100).toFixed(0)
      const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
      return `- ${g.name} (${g.type}): $${g.currentAmount.toFixed(0)}/$${g.targetAmount.toFixed(0)} (${pct}%)${daysLeft !== null ? `, ${daysLeft} days left` : ''}${g.priority ? `, priority: ${g.priority}` : ''}`
    })
    .join('\n')

  const budgetSummary = budgets
    .map((b) => {
      const pct = b.amount > 0 ? ((b.spent / b.amount) * 100).toFixed(0) : '0'
      return `- ${b.category}: $${b.spent.toFixed(0)}/$${b.amount.toFixed(0)} (${pct}% used)`
    })
    .join('\n')

  const portfolioSummary = holdings.length > 0
    ? holdings.map((h) => {
        const gain = h.quantity * h.currentPrice - h.quantity * h.avgCost
        const gainPct = ((h.currentPrice - h.avgCost) / h.avgCost * 100).toFixed(1)
        return `- ${h.symbol} (${h.name}): ${h.quantity} shares, cost $${h.avgCost.toFixed(2)}, current $${h.currentPrice.toFixed(2)}, ${gain >= 0 ? '+' : ''}$${gain.toFixed(2)} (${gainPct}%)`
      }).join('\n')
    : 'No investment holdings'

  const accountSummary = accounts
    .map((a) => `- ${a.name} (${a.type}): $${a.balance.toFixed(2)}`)
    .join('\n')

  const systemContext = `You are a knowledgeable, friendly personal finance AI advisor named FinanceAI. You have access to the user's COMPLETE financial data and must use it to provide personalized, actionable advice.

═══ USER FINANCIAL PROFILE ═══
Name: ${user?.name || 'User'}
Monthly Income: ${user?.monthlyIncome ? `$${user.monthlyIncome}` : 'Not set'}
Risk Tolerance: ${user?.riskTolerance || 'moderate'}
Currency: ${user?.currency || 'USD'}

═══ ACCOUNTS ═══
${accountSummary || 'No accounts'}
Total Balance: $${totalBalance.toFixed(2)}

═══ INCOME (Recent) ═══
Total recent income: $${totalIncome.toFixed(2)}

═══ EXPENSES (Recent) ═══
Total recent expenses: $${totalExpenses.toFixed(2)}
Savings Rate: ${totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 'N/A'}%

Top Spending Categories:
${topCategories || 'None recorded'}

Recent Transactions:
${recentTransactions || 'None'}

═══ BUDGETS ═══
${budgetSummary || 'No budgets set'}

═══ FINANCIAL GOALS ═══
${goalsSummary || 'No goals set'}

═══ INVESTMENT PORTFOLIO ═══
Total Portfolio Value: $${portfolioValue.toFixed(2)}
Total Cost Basis: $${portfolioCost.toFixed(2)}
Overall Gain/Loss: $${(portfolioValue - portfolioCost).toFixed(2)}

${portfolioSummary}

═══ AI RECOMMENDATIONS ═══
${recommendations.map(r => `- [${r.priority || 'medium'}] ${r.title}: ${r.content}`).join('\n') || 'No recommendations yet'}

═══ YOUR INSTRUCTIONS ═══
1. Always reference the user's ACTUAL data above — never make up numbers
2. Provide specific dollar amounts and percentages from their data
3. Give actionable, step-by-step advice they can implement today
4. Be encouraging but honest — if they're overspending, say so gently
5. For investment advice, always add a disclaimer that this is general guidance, not professional financial advice
6. Keep responses concise but thorough (2-4 paragraphs)
7. Use markdown formatting for readability (bold key numbers, bullet points for lists)
8. If the user asks about a specific category/goal/account, dive deep into that area
9. Proactively suggest improvements you notice in their data
10. End with a specific next-step recommendation when appropriate`

  // Stream the response from the real LLM
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- ai package installed at runtime, types not in this scope
    const aiModule = await import('ai')
    const sdkModule = await import('@shogo-ai/sdk')

    const provider = sdkModule.createShogoLlmProvider({
      apiKey: process.env.SHOGO_API_KEY || process.env.RUNTIME_AUTH_SECRET,
    })

    const result = aiModule.streamText({
      model: provider('claude-haiku-4-5-20251001'),
      system: systemContext,
      messages: [{ role: 'user', content: message }],
      maxTokens: 1024,
    })

    let response = ''
    for await (const chunk of result.textStream) {
      response += chunk
    }

    return c.json({ response, source: 'ai' })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'

    // Intelligent fallback using the actual data (not templates)
    const input = message.toLowerCase()
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0

    let response = ''

    if (input.includes('spending') || input.includes('expense') || input.includes('where') && input.includes('money')) {
      const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
      response = `**Your Spending Analysis**\n\n`
      response += `Your total recent expenses are **$${totalExpenses.toFixed(2)}** across ${Object.keys(byCategory).length} categories.\n\n`
      response += `**Breakdown by Category:**\n`
      for (const [cat, amt] of sortedCats) {
        const pct = totalExpenses > 0 ? (amt / totalExpenses * 100).toFixed(1) : '0'
        const bar = '█'.repeat(Math.round(Number(pct) / 5))
        response += `• ${cat}: **$${amt.toFixed(2)}** (${pct}%) ${bar}\n`
      }
      const highest = sortedCats[0]
      if (highest) {
        response += `\n**💡 Insight:** ${highest[0]} is your biggest expense at $${highest[1].toFixed(2)}. `
        if (highest[0] === 'Housing') {
          response += `Housing typically should stay under 30% of income. ${totalExpenses > 0 && (highest[1] / totalExpenses) > 0.5 ? 'At over 50% of your expenses, this is worth reviewing.' : 'Your housing costs look reasonable.'}`
        } else {
          response += `This is an area where small reductions could add up to significant savings over time.`
        }
      }
    } else if (input.includes('goal') || input.includes('saving') || input.includes('target')) {
      response = `**Your Financial Goals Progress**\n\n`
      if (goals.length === 0) {
        response += `You don't have any goals set yet. Setting specific, time-bound goals is one of the most effective ways to build wealth. I'd recommend starting with an emergency fund covering 3-6 months of expenses.\n\n**Suggested first goal:** Emergency fund of **$${(totalExpenses * 3).toFixed(0)}** (3 months of expenses)`
      } else {
        for (const g of goals) {
          const pct = ((g.currentAmount / g.targetAmount) * 100).toFixed(1)
          const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
          const remaining = g.targetAmount - g.currentAmount
          response += `• **${g.name}**: $${g.currentAmount.toFixed(0)} / $${g.targetAmount.toFixed(0)} (${pct}%)\n`
          if (daysLeft !== null) {
            const monthlyNeeded = daysLeft > 0 ? (remaining / (daysLeft / 30)) : remaining
            response += `  Deadline: ${daysLeft} days left | Need **$${monthlyNeeded.toFixed(0)}/month** to reach target\n`
          }
          response += `\n`
        }
      }
    } else if (input.includes('budget')) {
      response = `**Your Budget Overview**\n\n`
      if (budgets.length === 0) {
        response += `You don't have any budgets set. I recommend using the 50/30/20 rule:\n• **50%** for needs (housing, food, utilities)\n• **30%** for wants (entertainment, dining)\n• **20%** for savings and debt repayment\n\nWith your income of **$${(user?.monthlyIncome ?? 0).toFixed(0)}/month**, that would be:\n• Needs: $${((user?.monthlyIncome ?? 0) * 0.5).toFixed(0)}\n• Wants: $${((user?.monthlyIncome ?? 0) * 0.3).toFixed(0)}\n• Savings: $${((user?.monthlyIncome ?? 0) * 0.2).toFixed(0)}`
      } else {
        for (const b of budgets) {
          const pct = b.amount > 0 ? (b.spent / b.amount * 100).toFixed(0) : '0'
          const icon = Number(pct) >= 100 ? '🔴' : Number(pct) >= 80 ? '🟡' : '🟢'
          response += `• ${icon} **${b.category}**: $${b.spent.toFixed(0)} / $${b.amount.toFixed(0)} (${pct}% used)\n`
        }
        const overBudget = budgets.filter(b => b.amount > 0 && b.spent > b.amount)
        if (overBudget.length > 0) {
          response += `\n⚠️ **${overBudget.length} budget(s) exceeded:** ${overBudget.map(b => b.category).join(', ')}. Consider reducing spending in these areas.`
        }
      }
    } else if (input.includes('invest') || input.includes('portfolio') || input.includes('stock')) {
      response = `**Your Investment Portfolio**\n\n`
      response += `Portfolio Value: **$${portfolioValue.toFixed(2)}** | Cost Basis: **$${portfolioCost.toFixed(2)}**\n`
      const totalGain = portfolioValue - portfolioCost
      response += `Overall: **${totalGain >= 0 ? '+' : ''}$${totalGain.toFixed(2)}** (${portfolioCost > 0 ? (totalGain / portfolioCost * 100).toFixed(1) : 0}%)\n\n`
      if (holdings.length > 0) {
        for (const h of holdings) {
          const gain = h.quantity * h.currentPrice - h.quantity * h.avgCost
          response += `• **${h.symbol}**: ${h.quantity} shares @ $${h.currentPrice.toFixed(2)} — ${gain >= 0 ? '📈' : '📉'} ${gain >= 0 ? '+' : ''}$${gain.toFixed(2)}\n`
        }
        response += `\nFor a **${user?.riskTolerance || 'moderate'}** risk profile, your current allocation looks ${
          holdings.length >= 3 ? 'reasonably diversified' : 'concentrated — consider adding more variety'
        }.\n\n`
        response += `⚠️ *This is general guidance, not professional financial advice. Consider consulting a licensed advisor for personalized investment strategies.*`
      } else {
        response += `You don't have any investment holdings yet. Starting early is key — even small regular investments can grow significantly over time through compound returns.`
      }
    } else if (input.includes('summary') || input.includes('overview') || input.includes('health')) {
      response = `**Your Financial Health Summary**\n\n`
      response += `💰 **Balance:** $${totalBalance.toFixed(2)}\n`
      response += `📈 **Portfolio:** $${portfolioValue.toFixed(2)}\n`
      response += `🎯 **Net Worth:** $${(totalBalance + portfolioValue).toFixed(2)}\n\n`
      response += `**Income vs Expenses:**\n`
      response += `• Income: $${totalIncome.toFixed(2)}\n`
      response += `• Expenses: $${totalExpenses.toFixed(2)}\n`
      response += `• Savings Rate: **${savingsRate.toFixed(1)}%** ${savingsRate >= 20 ? '✅ Above 20% target' : '⚠️ Below 20% target'}\n\n`
      const activeGoals = goals.filter(g => !g.isCompleted)
      response += `**Active Goals:** ${activeGoals.length}\n`
      response += `**Active Budgets:** ${budgets.length}\n`
      response += `**Investments:** ${holdings.length} holdings\n\n`
      if (savingsRate >= 20) {
        response += `Great job! Your savings rate is healthy. Keep it up and consider maximizing tax-advantaged accounts.`
      } else {
        response += `**Recommendation:** Focus on increasing your savings rate to at least 20%. Review your top expense categories for optimization opportunities.`
      }
    } else {
      response = `I'm here to help with your finances! Here's what I can see:\n\n`
      response += `• **Balance:** $${totalBalance.toFixed(2)} | **Portfolio:** $${portfolioValue.toFixed(2)}\n`
      response += `• **Recent expenses:** $${totalExpenses.toFixed(2)} across ${Object.keys(byCategory).length} categories\n`
      response += `• **Goals:** ${goals.length} active | **Budgets:** ${budgets.length}\n`
      response += `• **Savings rate:** ${savingsRate.toFixed(1)}%\n\n`
      response += `Ask me about any of these topics:\n`
      response += `• "Analyze my spending" — detailed expense breakdown\n`
      response += `• "How are my goals?" — progress on financial targets\n`
      response += `• "Review my budgets" — budget utilization\n`
      response += `• "How's my portfolio?" — investment performance\n`
      response += `• "Financial health check" — complete summary`
    }

    return c.json({ response, source: 'fallback', error: errMsg })
  }
})

export default app
