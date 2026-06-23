import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Lightbulb,
  TrendingUp,
  Target,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Bell,
} from 'lucide-react'
import { getInsights, getRecommendations } from '@/lib/api'

interface Insight {
  type: string
  title: string
  content: string
  severity: string
}

interface Recommendation {
  id: string
  type: string
  title: string
  content: string
  priority: string | null
  isRead: boolean
}

const severityConfig: Record<string, { color: string; bgClass: string; borderClass: string; icon: React.ElementType }> = {
  success: { color: 'text-emerald-600', bgClass: 'bg-emerald-50 dark:bg-emerald-950/20', borderClass: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
  warning: { color: 'text-yellow-600', bgClass: 'bg-yellow-50 dark:bg-yellow-950/20', borderClass: 'border-yellow-200 dark:border-yellow-800', icon: AlertTriangle },
  danger: { color: 'text-red-600', bgClass: 'bg-red-50 dark:bg-red-950/20', borderClass: 'border-red-200 dark:border-red-800', icon: AlertTriangle },
  info: { color: 'text-blue-600', bgClass: 'bg-blue-50 dark:bg-blue-950/20', borderClass: 'border-blue-200 dark:border-blue-800', icon: Info },
}

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  spending: { label: 'Spending', icon: TrendingUp },
  budget: { label: 'Budget', icon: PiggyBank },
  goal: { label: 'Goal', icon: Target },
  savings: { label: 'Savings', icon: PiggyBank },
}

const recTypeConfig: Record<string, { label: string; color: string }> = {
  budget: { label: 'Budget', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  investment: { label: 'Investment', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  savings: { label: 'Savings', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  insight: { label: 'Insight', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
}

export default function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [insightsData, recsData] = await Promise.all([
        getInsights(),
        getRecommendations(),
      ])
      setInsights(insightsData.insights)
      setRecommendations(recsData.recommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
            <p className="text-muted-foreground">Personalized recommendations powered by AI</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
          <p className="text-muted-foreground">Personalized recommendations powered by AI analysis</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI-Powered Insights
            <Badge variant="secondary" className="ml-auto">
              <Bell className="h-3 w-3 mr-1" />
              {insights.length} new
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No insights available yet. Add some transactions to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const severity = severityConfig[insight.severity] || severityConfig.info
                const type = typeConfig[insight.type] || typeConfig.spending
                const Icon = severity.icon
                const TypeIcon = type.icon

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${severity.bgClass} ${severity.borderClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${severity.color} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${severity.color}`}>{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {type.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recommendations yet. Keep using the platform for personalized suggestions.
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => {
                const typeStyle = recTypeConfig[rec.type] || recTypeConfig.insight

                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-lg border bg-card ${rec.isRead ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge className={typeStyle.color}>{typeStyle.label}</Badge>
                          {rec.priority === 'high' && (
                            <Badge variant="destructive">High Priority</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.content}</p>
                      </div>
                      {!rec.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
