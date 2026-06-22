import { prisma } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding finance data...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'John Doe',
      monthlyIncome: 5200,
      riskTolerance: 'moderate',
      currency: 'USD',
    },
  })

  console.log(`✅ Created user: ${user.name}`)

  // Create accounts
  const checkingAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Main Checking',
      type: 'checking',
      balance: 8500,
      currency: 'USD',
    },
  })

  const savingsAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Savings Account',
      type: 'savings',
      balance: 15000,
      currency: 'USD',
    },
  })

  const creditCard = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Credit Card',
      type: 'credit',
      balance: -1200,
      currency: 'USD',
    },
  })

  const investmentAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Investment Account',
      type: 'investment',
      balance: 45230.75,
      currency: 'USD',
    },
  })

  console.log('✅ Created accounts')

  // Create transactions
  const transactions = [
    { accountId: checkingAccount.id, amount: 5200, type: 'income', category: 'Salary', description: 'Monthly Salary', date: new Date('2026-06-01') },
    { accountId: creditCard.id, amount: 127.50, type: 'expense', category: 'Food', description: 'Grocery Store', date: new Date('2026-06-19') },
    { accountId: checkingAccount.id, amount: 85, type: 'expense', category: 'Utilities', description: 'Electric Bill', date: new Date('2026-06-18') },
    { accountId: savingsAccount.id, amount: 850, type: 'income', category: 'Side Income', description: 'Freelance Payment', date: new Date('2026-06-17') },
    { accountId: creditCard.id, amount: 45.20, type: 'expense', category: 'Transportation', description: 'Gas Station', date: new Date('2026-06-16') },
    { accountId: creditCard.id, amount: 15.99, type: 'expense', category: 'Entertainment', description: 'Netflix Subscription', date: new Date('2026-06-15') },
    { accountId: creditCard.id, amount: 68.40, type: 'expense', category: 'Food', description: 'Restaurant Dinner', date: new Date('2026-06-14') },
    { accountId: checkingAccount.id, amount: 49.99, type: 'expense', category: 'Health', description: 'Gym Membership', date: new Date('2026-06-13') },
    { accountId: creditCard.id, amount: 320, type: 'expense', category: 'Housing', description: 'Rent Payment', date: new Date('2026-06-01') },
    { accountId: checkingAccount.id, amount: 150, type: 'expense', category: 'Food', description: 'Weekly Groceries', date: new Date('2026-06-10') },
  ]

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        ...transaction,
      },
    })
  }

  console.log(`✅ Created ${transactions.length} transactions`)

  // Create budgets
  const budgets = [
    { category: 'Housing', amount: 1500, spent: 1500, month: 6, year: 2026 },
    { category: 'Food', amount: 800, spent: 650, month: 6, year: 2026 },
    { category: 'Transportation', amount: 400, spent: 380, month: 6, year: 2026 },
    { category: 'Entertainment', amount: 300, spent: 290, month: 6, year: 2026 },
    { category: 'Utilities', amount: 250, spent: 220, month: 6, year: 2026 },
    { category: 'Health', amount: 150, spent: 49.99, month: 6, year: 2026 },
  ]

  for (const budget of budgets) {
    await prisma.budget.create({
      data: {
        userId: user.id,
        ...budget,
      },
    })
  }

  console.log(`✅ Created ${budgets.length} budgets`)

  // Create goals
  const goals = [
    { name: 'Emergency Fund', type: 'savings', targetAmount: 15000, currentAmount: 10800, deadline: new Date('2026-12-31'), priority: 'high' },
    { name: 'Summer Vacation', type: 'savings', targetAmount: 5000, currentAmount: 2250, deadline: new Date('2026-08-15'), priority: 'medium' },
    { name: 'New Car Down Payment', type: 'savings', targetAmount: 10000, currentAmount: 3200, deadline: new Date('2027-06-01'), priority: 'high' },
    { name: 'Investment Portfolio', type: 'investment', targetAmount: 25000, currentAmount: 8500, deadline: new Date('2028-01-01'), priority: 'medium' },
  ]

  for (const goal of goals) {
    await prisma.goal.create({
      data: {
        userId: user.id,
        ...goal,
      },
    })
  }

  console.log(`✅ Created ${goals.length} goals`)

  // Create portfolio holdings
  const holdings = [
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', quantity: 25, avgCost: 420.50, currentPrice: 485.20 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', quantity: 15, avgCost: 380, currentPrice: 412.80 },
    { symbol: 'BND', name: 'Vanguard Total Bond Market', quantity: 50, avgCost: 72.30, currentPrice: 74.15 },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market', quantity: 30, avgCost: 225, currentPrice: 248.90 },
    { symbol: 'ARKK', name: 'ARK Innovation ETF', quantity: 20, avgCost: 45, currentPrice: 52.30 },
  ]

  for (const holding of holdings) {
    await prisma.portfolio.create({
      data: {
        userId: user.id,
        accountId: investmentAccount.id,
        ...holding,
      },
    })
  }

  console.log(`✅ Created ${holdings.length} portfolio holdings`)

  // Create recommendations
  const recommendations = [
    { type: 'budget', title: 'Optimize Food Spending', content: 'You\'re $150 under budget on Food this month. Consider redirecting this to your Emergency Fund goal.', priority: 'medium' },
    { type: 'investment', title: 'Diversify Portfolio', content: 'Your portfolio is heavily weighted in US stocks. Consider increasing international exposure by 5%.', priority: 'high' },
    { type: 'savings', title: 'Accelerate Emergency Fund', content: 'At your current pace, you\'ll reach your emergency fund goal 2 weeks early. Consider increasing monthly contributions.', priority: 'medium' },
    { type: 'insight', title: 'Spending Pattern Detected', content: 'Your entertainment spending has increased 15% over the last 3 months. Review subscriptions for potential savings.', priority: 'low' },
  ]

  for (const recommendation of recommendations) {
    await prisma.recommendation.create({
      data: {
        userId: user.id,
        ...recommendation,
      },
    })
  }

  console.log(`✅ Created ${recommendations.length} recommendations`)

  console.log('\n🎉 Seed data created successfully!')
  console.log(`\n📊 Summary:`)
  console.log(`- User: ${user.name} (${user.email})`)
  console.log(`- Accounts: 4`)
  console.log(`- Transactions: ${transactions.length}`)
  console.log(`- Budgets: ${budgets.length}`)
  console.log(`- Goals: ${goals.length}`)
  console.log(`- Portfolio Holdings: ${holdings.length}`)
  console.log(`- Recommendations: ${recommendations.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })