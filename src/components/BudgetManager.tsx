import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  X
} from 'lucide-react'

const CATEGORIES = ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Health', 'Other']

interface BudgetPerformance {
  id: string
  category: string
  amount: number
  spent: number
  percentage: number
  remaining: number
  status: 'on-track' | 'warning' | 'over'
  month: number
  year: number
}

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<BudgetPerformance[]>([])
  const [totalBudgeted, setTotalBudgeted] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')

  const [newBudget, setNewBudget] = useState({ category: 'Food', amount: '' })

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/budget-performance')
      if (res.ok) {
        const data = await res.json()
        setBudgets(data.budgets ?? [])
        setTotalBudgeted(data.totalBudgeted ?? 0)
        setTotalSpent(data.totalSpent ?? 0)
        setRemaining(data.remaining ?? 0)
      }
    } catch (e) {
      console.error('Failed to fetch budgets:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBudgets() }, [])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const handleAdd = async () => {
    if (!newBudget.amount) return
    const now = new Date()
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newBudget.category,
          amount: parseFloat(newBudget.amount),
          spent: 0,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      })
      if (res.ok) {
        setShowAddForm(false)
        setNewBudget({ category: 'Food', amount: '' })
        fetchBudgets()
      }
    } catch (e) {
      console.error('Failed to add budget:', e)
    }
  }

  const handleUpdateAmount = async (id: string) => {
    if (!editAmount) return
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(editAmount) }),
      })
      if (res.ok) {
        setEditingId(null)
        setEditAmount('')
        fetchBudgets()
      }
    } catch (e) {
      console.error('Failed to update budget:', e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
      if (res.ok) fetchBudgets()
    } catch (e) {
      console.error('Failed to delete budget:', e)
    }
  }

  const statusConfig = {
    'on-track': { label: 'On Track', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle },
    warning: { label: 'Near Limit', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle },
    over: { label: 'Over Budget', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget Manager</h2>
          <p className="text-muted-foreground">Track your spending against budgets</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Budget'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalBudgeted)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalSpent)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmt(remaining)}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle>Add New Budget</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newBudget.category} onChange={e => setNewBudget(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Budget</Label>
                <Input type="number" placeholder="0.00" step="0.01" value={newBudget.amount} onChange={e => setNewBudget(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleAdd} disabled={!newBudget.amount}>Save Budget</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>)}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No budgets set. Add your first budget above!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map(budget => {
            const status = statusConfig[budget.status]
            const StatusIcon = status.icon
            const isEditing = editingId === budget.id

            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{budget.category}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${status.color} ${status.bg}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    {!isEditing && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(budget.id); setEditAmount(budget.amount.toString()) }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(budget.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">
                      {fmt(budget.spent)} / {isEditing ? (
                        <span className="inline-flex items-center gap-1">
                          <Input className="h-6 w-24 inline-block text-xs" type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                          <Button size="sm" className="h-6 px-2" onClick={() => handleUpdateAmount(budget.id)}>Save</Button>
                        </span>
                      ) : fmt(budget.amount)}
                    </span>
                  </div>
                  <Progress value={Math.min(budget.percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{budget.percentage.toFixed(1)}% used</span>
                    <span>{fmt(budget.remaining)} remaining</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}