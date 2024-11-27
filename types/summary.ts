export interface PlayerSummary {
  totalPlayers: number
  activePlayers: number
  injuredPlayers: number
  averageAge: number
  positionBreakdown: {
    [key: string]: number
  }
}

export interface StaffSummary {
  totalStaff: number
  departments: {
    [key: string]: number
  }
  roles: {
    [key: string]: number
  }
}

export interface FinanceSummary {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  budgetUtilization: number
  revenueStreams: {
    [key: string]: number
  }
  expenseCategories: {
    [key: string]: number
  }
  monthlyTrends: {
    [key: string]: {
      revenue: number
      expenses: number
    }
  }
  keyMetrics: {
    revenueGrowth: number
    profitMargin: number
    operatingCosts: number
    cashReserves: number
    outstandingPayables: number
    outstandingReceivables: number
  }
} 