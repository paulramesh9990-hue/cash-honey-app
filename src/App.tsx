// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  Bot,
  TrendingUp,
  Lightbulb,
} from 'lucide-react'
import Dashboard from '@/components/Dashboard'
import TransactionTracker from '@/components/TransactionTracker'
import BudgetManager from '@/components/BudgetManager'
import GoalSetter from '@/components/GoalSetter'
import AIAdvisor from '@/components/AIAdvisor'
import InvestmentView from '@/components/InvestmentView'
import InsightsPanel from '@/components/InsightsPanel'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🍯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">Cash Honey</h1>
                <p className="text-sm text-muted-foreground">Your AI Finance Advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <Bot className="h-4 w-4 mr-1" />
                AI Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              <span className="hidden sm:inline">Budgets</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Investments</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Advisor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionTracker />
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetManager />
          </TabsContent>

          <TabsContent value="goals">
            <GoalSetter />
          </TabsContent>

          <TabsContent value="investments">
            <InvestmentView />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsPanel />
          </TabsContent>

          <TabsContent value="advisor">
            <AIAdvisor />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2026 Cash Honey. AI-powered financial advice.</p>
            <p>Built with 🍯 by Cash Honey</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
