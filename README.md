# FinanceAI - AI-Powered Personal Finance Advisor

An intelligent personal finance platform that leverages machine learning to analyze spending patterns, provide investment strategies, and offer personalized budgeting advice.

## 🚀 Features

### Core Features
- **Financial Dashboard** - Real-time overview of your financial health
- **Transaction Tracker** - Log and categorize income/expenses
- **Budget Manager** - Set and monitor category budgets
- **Goal Setter** - Track savings and investment targets
- **Investment Portfolio** - Monitor holdings and performance
- **AI Financial Advisor** - Chat interface for personalized advice

### AI-Powered Insights
- Spending pattern analysis
- Budget optimization recommendations
- Investment strategy suggestions
- Savings goal acceleration tips
- Market trend insights

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Hono + Prisma + SQLite
- **Charts**: Recharts for data visualization
- **AI**: Shogo AI SDK for intelligent recommendations
- **Icons**: Lucide React

### Data Models
- **User** - Financial profile and preferences
- **Account** - Bank accounts, credit cards, investments
- **Transaction** - Income/expenses with categories
- **Budget** - Monthly spending limits by category
- **Goal** - Savings/investment targets with deadlines
- **Portfolio** - Investment holdings and performance
- **Recommendation** - AI-generated advice

## 📦 Installation

```bash
# Install dependencies
bun install

# Generate Prisma client
bunx prisma generate

# Apply database schema
bunx prisma db push

# Seed sample data
bun run scripts/seed-finance-data.ts

# Start development server
bun run dev
```

## 🎯 Usage

### Dashboard
View your complete financial overview:
- Total balance and net worth
- Monthly income vs expenses
- Savings rate tracking
- Financial goal progress

### Transactions
Track all financial activity:
- Add income and expenses
- Categorize transactions
- Filter by date, category, or amount
- View spending summaries

### Budgets
Manage monthly budgets:
- Set spending limits by category
- Track actual vs budgeted amounts
- Get alerts when approaching limits
- AI-powered optimization tips

### Goals
Set and track financial objectives:
- Emergency fund targets
- Vacation savings
- Investment goals
- Debt payoff plans

### Investments
Monitor your portfolio:
- Track individual holdings
- View performance metrics
- Analyze asset allocation
- Get rebalancing suggestions

### AI Advisor
Chat with your personal financial advisor:
- Ask about budgeting strategies
- Get investment recommendations
- Receive savings optimization tips
- Discuss financial goals

## 🔧 API Endpoints

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Transactions
- `GET /api/transactions` - List all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - List all budgets
- `GET /api/budgets/:id` - Get budget by ID
- `POST /api/budgets` - Create new budget
- `PATCH /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Goals
- `GET /api/goals` - List all goals
- `GET /api/goals/:id` - Get goal by ID
- `POST /api/goals` - Create new goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Portfolios
- `GET /api/portfolios` - List all holdings
- `GET /api/portfolios/:id` - Get holding by ID
- `POST /api/portfolios` - Create new holding
- `PATCH /api/portfolios/:id` - Update holding
- `DELETE /api/portfolios/:id` - Delete holding

### Recommendations
- `GET /api/recommendations` - List all recommendations
- `GET /api/recommendations/:id` - Get recommendation by ID
- `POST /api/recommendations` - Create new recommendation
- `PATCH /api/recommendations/:id` - Update recommendation
- `DELETE /api/recommendations/:id` - Delete recommendation

## 🎨 UI Components

### Dashboard
- **Key Metrics Cards** - Balance, income, expenses, savings rate
- **Area Chart** - Monthly income vs expenses trend
- **Pie Chart** - Spending by category breakdown
- **Progress Bars** - Financial goal tracking

### Transaction Tracker
- **Transaction Table** - Sortable list of all transactions
- **Search & Filter** - Find transactions by category or description
- **Add Transaction Form** - Quick entry for new transactions
- **Summary Cards** - Total income, expenses, and net flow

### Budget Manager
- **Budget Cards** - Category-wise budget tracking
- **Progress Indicators** - Visual budget utilization
- **Status Badges** - On track, near limit, over budget
- **AI Insights** - Optimization recommendations

### Goal Setter
- **Goal Cards** - Individual goal progress tracking
- **Bar Chart** - Progress comparison across goals
- **Timeline Tracking** - Days remaining and monthly needed
- **Priority Indicators** - High, medium, low priority

### Investment View
- **Portfolio Summary** - Total value, cost, gain/loss
- **Line Chart** - Portfolio performance over time
- **Pie Chart** - Asset allocation breakdown
- **Holdings Table** - Individual stock/ETF performance

### AI Advisor
- **Chat Interface** - Conversational financial advice
- **Quick Actions** - One-click analysis buttons
- **Message History** - Track your conversation
- **AI Insights** - Categorized recommendations

## 🔒 Security

- Session-based authentication
- Data encryption at rest
- Secure API endpoints
- Input validation and sanitization
- SQL injection prevention via Prisma

## 📊 Sample Data

The seed script creates:
- 1 test user (John Doe)
- 4 accounts (Checking, Savings, Credit Card, Investment)
- 10 transactions (mix of income/expenses)
- 6 budgets (monthly category limits)
- 4 goals (Emergency Fund, Vacation, Car, Investment)
- 5 portfolio holdings (VOO, QQQ, BND, VTI, ARKK)
- 4 AI recommendations

## 🚦 Development

### Build Status
```bash
# Check build status
tail -5 .shogo/logs/build.log

# Run linter
bunx eslint src/

# Type check
bunx tsc --noEmit
```

### Database
```bash
# View database
sqlite3 prisma/dev.db

# Reset database
rm prisma/dev.db
bunx prisma db push
bun run scripts/seed-finance-data.ts
```

## 🎯 Future Enhancements

- [ ] Real-time market data integration
- [ ] Bank account linking (Plaid integration)
- [ ] Advanced ML models for predictions
- [ ] Multi-currency support
- [ ] Mobile responsive design
- [ ] Export reports (PDF/CSV)
- [ ] Bill reminders and notifications
- [ ] Shared budgets with family members
- [ ] Tax optimization suggestions
- [ ] Retirement planning calculator

## 📝 License

This project is licensed under the Apache License 2.0.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Built with ❤️ using Shogo AI**