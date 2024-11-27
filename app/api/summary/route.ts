import { NextRequest, NextResponse } from 'next/server'
import { PlayerSummary, StaffSummary, FinanceSummary } from '@/types/summary'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const playerFilter = searchParams.get('playerFilter')
  const staffFilter = searchParams.get('staffFilter')
  const financeFilter = searchParams.get('financeFilter') || 'all'

  // Mock data with realistic Sri Lankan sports club finances
  const summaryData = {
    players: {
      totalPlayers: 24,
      activePlayers: playerFilter === 'active' ? 20 : 24,
      injuredPlayers: playerFilter === 'injured' ? 4 : 0,
      averageAge: 23.5,
      positionBreakdown: {
        'Forward': 6,
        'Midfielder': 8,
        'Defender': 8,
        'Goalkeeper': 2
      }
    },
    staff: {
      totalStaff: 12,
      departments: {
        'Coaching': 4,
        'Medical': 3,
        'Administrative': 3,
        'Technical': 2
      },
      roles: {
        'Head Coach': 1,
        'Assistant Coach': 3,
        'Physiotherapist': 2,
        'Team Doctor': 1,
        'Admin Staff': 3,
        'Technical Staff': 2
      }
    },
    finance: {
      totalRevenue: 2750000,              // 2.75M LKR monthly
      totalExpenses: 2100000,             // 2.1M LKR monthly
      netIncome: 650000,                  // 650K LKR monthly
      budgetUtilization: 76.4,            // 76.4%
      revenueStreams: financeFilter === 'revenue' || financeFilter === 'all' ? {
        'Match Day Income': 800000,       // Ticket sales, food & beverage
        'Sponsorships': 1000000,          // Local business sponsorships
        'Membership Fees': 400000,        // Monthly membership fees
        'Academy Program': 250000,        // Youth training fees
        'Merchandise Sales': 200000,      // Club merchandise
        'Facility Rentals': 100000,       // Ground rentals
      } : {},
      expenseCategories: financeFilter === 'expenses' || financeFilter === 'all' ? {
        'Player Salaries': 1000000,       // Player wages
        'Coaching Staff': 400000,         // Coaching team salaries
        'Ground Staff': 150000,           // Maintenance workers
        'Administrative': 200000,         // Office staff
        'Facility Maintenance': 150000,   // Ground upkeep
        'Equipment': 100000,              // Sports equipment
        'Utilities': 50000,               // Electricity, water
        'Youth Development': 50000,       // Academy expenses
      } : {},
      monthlyTrends: financeFilter === 'trends' || financeFilter === 'all' ? {
        'January': { revenue: 2600000, expenses: 2000000 },
        'February': { revenue: 2800000, expenses: 2100000 },
        'March': { revenue: 2750000, expenses: 2050000 },
        'April': { revenue: 2500000, expenses: 1950000 },
        'May': { revenue: 2900000, expenses: 2200000 },
        'June': { revenue: 2700000, expenses: 2050000 }
      } : {},
      keyMetrics: {
        revenueGrowth: 8.5,               // YoY growth
        profitMargin: 23.6,               // Net profit margin
        operatingCosts: 2100000,          // Monthly operating costs
        cashReserves: 3500000,            // Available cash
        outstandingPayables: 500000,      // Unpaid bills
        outstandingReceivables: 300000    // Expected payments
      }
    }
  }

  return NextResponse.json(summaryData)
} 