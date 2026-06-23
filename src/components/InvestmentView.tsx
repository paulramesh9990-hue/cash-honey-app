import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  BarChart3,
  X
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

const ALLOC_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280']

interface Holding {
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
}

interface PortfolioSummary {
  holdings: Holding[]
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPercent: number
}

export default function InvestmentView() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [newHolding, setNewHolding] = useState({
    symbol: '', name: '', quantity: '', avgCost: '', accountId: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [portfolioRes, accountsRes] = await Promise.all([
        fetch('/api/analytics/portfolio'),
        fetch('/api/accounts?type=investment'),
      ])
      if (portfolioRes.ok) setPortfolio(await portfolioRes.json())
      if (accountsRes.ok) {
        const data = await accountsRes.json()
        const accs = data.items ?? data
        setAccounts(accs)
        if (accs.length > 0) setNewHolding(p => ({ ...p, accountId: accs[0].id }))
      }
    } catch (e) {
      console.error('Failed to fetch portfolio:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

  const handleAdd = async () => {
    if (!newHolding.symbol || !newHolding.quantity || !newHolding.avgCost || !newHolding.accountId) return
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newHolding.symbol.toUpperCase(),
          name: newHolding.name || newHolding.symbol.toUpperCase(),
          quantity: parseFloat(newHolding.quantity),
          avgCost: parseFloat(newHolding.avgCost),
          currentPrice: parseFloat(newHolding.avgCost),
          accountId: newHolding.accountId,
        }),
      })
      if (res.ok) {
        setShowAddForm(false)
        setNewHolding({ symbol: '', name: '', quantity: '', avgCost: '', accountId: newHolding.accountId })
        fetchData()
      }
    } catch (e) {
      console.error('Failed to add holding:', e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/portfolios/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (e) {
      console.error('Failed to delete holding:', e)
    }
  }

  const allocationData = portfolio?.holdings
    ? (() => {
        const bySymbol: Record<string, number> = {}
        for (const h of portfolio.holdings) {
          bySymbol[h.symbol] = (bySymbol[h.symbol] || 0) + h.marketValue
        }
        return Object.entries(bySymbol)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, value]) => ({ name, value }))
      })()
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Investment Portfolio</h2>
          <p className="text-muted-foreground">Track your investments and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'Add Holding'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle>Add New Holding</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input placeholder="e.g., AAPL" value={newHolding.symbol} onChange={e => setNewHolding(p => ({ ...p, symbol: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input placeholder="e.g., Apple Inc." value={newHolding.name} onChange={e => setNewHolding(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shares</label>
                <Input type="number" placeholder="0" value={newHolding.quantity} onChange={e => setNewHolding(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Avg Cost</label>
                <Input type="number" placeholder="0.00" step="0.01" value={newHolding.avgCost} onChange={e => setNewHolding(p => ({ ...p, avgCost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newHolding.accountId} onChange={e => setNewHolding(p => ({ ...p, accountId: e.target.value }))}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleAdd} disabled={!newHolding.symbol || !newHolding.quantity}>Save Holding</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !portfolio ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
          </div>
        </div>
      ) : !portfolio || portfolio.holdings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No holdings yet. Add your first investment above!
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{fmt(portfolio.totalValue)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{fmt(portfolio.totalCost)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gain/Loss</CardTitle>
                {portfolio.totalGainLoss >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(portfolio.totalGainLoss)}
                </div>
                <p className={`text-xs ${portfolio.totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmtPct(portfolio.totalGainLossPercent)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Holdings</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{portfolio.holdings.length}</div></CardContent>
            </Card>
          </div>

          {allocationData.length > 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Portfolio Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ month: 'Today', value: portfolio.totalValue }, { month: 'Cost', value: portfolio.totalCost }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Asset Allocation</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={allocationData} cx="50%" cy="50%" labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80} dataKey="value">
                          {allocationData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={ALLOC_COLORS[index % ALLOC_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>Your Holdings</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Symbol</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-right py-3 px-4">Shares</th>
                      <th className="text-right py-3 px-4">Avg Cost</th>
                      <th className="text-right py-3 px-4">Price</th>
                      <th className="text-right py-3 px-4">Value</th>
                      <th className="text-right py-3 px-4">Gain/Loss</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map(h => (
                      <tr key={h.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4"><Badge variant="secondary" className="font-mono">{h.symbol}</Badge></td>
                        <td className="py-3 px-4">{h.name}</td>
                        <td className="py-3 px-4 text-right">{h.quantity}</td>
                        <td className="py-3 px-4 text-right">{fmt(h.avgCost)}</td>
                        <td className="py-3 px-4 text-right font-medium">{fmt(h.currentPrice)}</td>
                        <td className="py-3 px-4 text-right font-medium">{fmt(h.marketValue)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${h.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmt(h.gainLoss)} ({fmtPct(h.gainLossPercent)})
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)} className="text-red-600">Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}