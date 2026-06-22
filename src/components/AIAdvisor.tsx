import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Send,
  Bot,
  User,
  TrendingUp,
  PiggyBank,
  Target,
  Lightbulb,
  RefreshCw
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickActions = [
  { label: 'Analyze Spending', icon: TrendingUp, prompt: 'Analyze my spending patterns and suggest optimizations' },
  { label: 'Budget Review', icon: PiggyBank, prompt: 'Review my budgets and identify areas to cut costs' },
  { label: 'Goal Progress', icon: Target, prompt: 'How am I progressing toward my financial goals?' },
  { label: 'Investment Advice', icon: Lightbulb, prompt: 'What investment strategies should I consider based on my portfolio?' },
]

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! 🍯 Welcome to Cash Honey — your personal AI finance advisor. I can see your real financial data — transactions, budgets, goals, and investments. Ask me anything about your money and I'll give you personalized, actionable advice!",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const handleSend = async (content: string) => {
    if (!content.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const errData = await res.json().catch(() => ({ response: '' }))
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errData.error || `Sorry, I encountered an error (${res.status}). Please try again.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (e) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I couldn\'t connect to the server. Please check your connection and try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">🍯 Cash Honey AI</h2>
          <p className="text-muted-foreground">Get personalized advice powered by your real financial data</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Bot className="h-4 w-4 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto flex flex-col items-center gap-2 p-4"
            onClick={() => handleSend(action.prompt)}
            disabled={isTyping}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            🍯 Cash Honey Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                  {message.role === 'user' && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about budgeting, investments, savings, or any financial topic..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              className="flex-1"
              disabled={isTyping}
            />
            <Button onClick={() => handleSend(inputValue)} disabled={!inputValue.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Cash Honey AI — personalized advice based on your real financial data. Always consult a professional for major decisions.
          </p>
        </div>
      </Card>
    </div>
  )
}