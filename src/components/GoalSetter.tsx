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
  Target,
  Calendar,
  TrendingUp,
  X
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface GoalItem {
  id: string
  name: string
  type: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  priority: string
  percentage: number
  remaining: number
  daysRemaining: number | null
  monthlyNeeded: number | null
}

export default function GoalSetter() {
  const [goals, setGoals] = useState<GoalItem[]>([])
  const [totalTarget, setTotalTarget] = useState(0)
  const [totalCurrent, setTotalCurrent] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: '', type: 'savings', targetAmount: '', deadline: '', priority: 'medium',
  })

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/goals-progress')
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals ?? [])
        setTotalTarget(data.totalTarget ?? 0)
        setTotalCurrent(data.totalCurrent ?? 0)
        setOverallProgress(data.overallProgress ?? 0)
      }
    } catch (e) {
      console.error('Failed to fetch goals:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGoals() }, [])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const handleAdd = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGoal.name,
          type: newGoal.type,
          targetAmount: parseFloat(newGoal.targetAmount),
          currentAmount: 0,
          deadline: newGoal.deadline ? new Date(newGoal.deadline).toISOString() : null,
          priority: newGoal.priority,
        }),
      })
      if (res.ok) {
        setShowAddForm(false)
        setNewGoal({ name: '', type: 'savings', targetAmount: '', deadline: '', priority: 'medium' })
        fetchGoals()
      }
    } catch (e) {
      console.error('Failed to add goal:', e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (res.ok) fetchGoals()
    } catch (e) {
      console.error('Failed to delete goal:', e)
    }
  }

  const handleContribute = async (id: string, amount: number) => {
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAmount: goal.currentAmount + amount }),
      })
      if (res.ok) fetchGoals()
    } catch (e) {
      console.error('Failed to contribute to goal:', e)
    }
  }

  const priorityColor: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-emerald-500',
  }

  const chartData = goals.map(g => ({
    name: g.name.length > 15 ? g.name.substring(0, 15) + '...' : g.name,
    current: g.currentAmount,
    target: g.targetAmount,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Goals</h2>
          <p className="text-muted-foreground">Track progress toward your savings and investment targets</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Goal'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalTarget)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{fmt(totalCurrent)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalTarget - totalCurrent)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle>Add New Goal</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input placeholder="e.g., Emergency Fund" value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newGoal.type} onChange={e => setNewGoal(p => ({ ...p, type: e.target.value }))}>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                  <option value="debt_payoff">Debt Payoff</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Amount</Label>
                <Input type="number" placeholder="0.00" step="0.01" value={newGoal.targetAmount} onChange={e => setNewGoal(p => ({ ...p, targetAmount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={newGoal.deadline} onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newGoal.priority} onChange={e => setNewGoal(p => ({ ...p, priority: e.target.value }))}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleAdd} disabled={!newGoal.name || !newGoal.targetAmount}>Save Goal</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>)}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No goals yet. Add your first financial goal above!
          </CardContent>
        </Card>
      ) : (
        <>
          {goals.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Goal Progress Comparison</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="current" fill="#10b981" name="Current" />
                      <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {goals.map(goal => (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </div>
                  <Badge className={priorityColor[goal.priority] ?? 'bg-gray-500'}>{goal.priority}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}</span>
                  </div>
                  <Progress value={Math.min(goal.percentage, 100)} className="h-3" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Deadline</p>
                        <p className="font-medium">
                          {goal.daysRemaining !== null
                            ? goal.daysRemaining > 0 ? `${goal.daysRemaining} days left` : 'Overdue'
                            : 'No deadline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Monthly Needed</p>
                        <p className="font-medium">{goal.monthlyNeeded ? fmt(goal.monthlyNeeded) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleContribute(goal.id, 100)}>+$100</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleContribute(goal.id, 500)}>+$500</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleContribute(goal.id, 1000)}>+$1,000</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(goal.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}