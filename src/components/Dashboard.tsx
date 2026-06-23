import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  DollarSign,
  PiggyBank,
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#6b7280']

interface OverviewData {
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
}

interface SpendingData {
  totalExpenses: number
  categoryBreakdown: Array<{ name: string; value: number; percentage: number }>
  monthlyTrend: Array<{ month: string; income: number; expense: number }>
}

interface GoalData {
  goals: Array<{
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    percentage: number
    daysRemaining: number | null
    monthlyNeeded: number | null
  }>
  totalTarget: number
  totalCurrent: number
  overallProgress: number
}

export default function Dashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [spending, setSpending] = useState<SpendingData | null>(null)
  const [goals, setGoals] = useState<GoalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [overviewRes, spendingRes, goalsRes] = await Promise.all([
        fetch('/api/dashboard/overview'),
        fetch('/api/analytics/spending'),
        fetch('/api/goals-progress'),
      ])
      if (overviewRes.ok) setOverview(await overviewRes.json())
      if (spendingRes.ok) setSpending(await spendingRes.json())
      if (goalsRes.ok) setGoals(await goalsRes.json())
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const fmtMonth = (key: string) => {
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'short' })
  }

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">🍯 Financial Dashboard</h2>
          <p className="text-muted-foreground">Your Cash Honey financial overview at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <button onClick={fetchAll} className="p-2 rounded-md hover:bg-muted" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(overview?.totalBalance ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              Net worth: {fmt(overview?.netWorth ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{fmt(overview?.monthlyIncome ?? 0)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(overview?.monthlyExpenses ?? 0)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(overview?.savingsRate ?? 0) >= 20 ? 'text-emerald-600' : 'text-yellow-600'}`}>
              {(overview?.savingsRate ?? 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {(overview?.savingsRate ?? 0) >= 20 ? '✓ Above 20% target' : 'Below 20% target'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {spending?.monthlyTrend && spending.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spending.monthlyTrend.map(d => ({ ...d, label: fmtMonth(d.month) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Income" />
                    <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No transaction data yet. Add transactions to see trends.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {spending?.categoryBreakdown && spending.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spending.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spending.categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No expense data yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      {goals && goals.goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Financial Goals
              <Badge variant="secondary" className="ml-auto">{goals.overallProgress.toFixed(1)}% overall</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
                    </span>
                  </div>
                  <Progress value={Math.min(goal.percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{goal.percentage.toFixed(1)}% complete</span>
                    {goal.daysRemaining !== null && (
                      <span>{goal.daysRemaining} days remaining</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      {overview && overview.portfolioValue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Investment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">{fmt(overview.portfolioValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${overview.portfolioGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {overview.portfolioGainLoss >= 0 ? '+' : ''}{fmt(overview.portfolioGainLoss)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goals Funded</p>
                <p className="text-2xl font-bold">{fmt(goals?.totalCurrent ?? 0)} / {fmt(goals?.totalTarget ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}