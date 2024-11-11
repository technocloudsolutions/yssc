'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Award,
  Target,
  Star,
  Download,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Analytics {
  playerStats: {
    totalPlayers: number;
    activePlayers: number;
    averageAge: number;
    positionBreakdown: Record<string, number>;
  };
  performanceStats: {
    totalGames: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
    cleanSheets: number;
    averageRating: number;
  };
  financialStats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    revenueBreakdown: Record<string, number>;
    expenseBreakdown: Record<string, number>;
  };
  staffStats: {
    totalStaff: number;
    departmentBreakdown: Record<string, number>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    playerStats: {
      totalPlayers: 0,
      activePlayers: 0,
      averageAge: 0,
      positionBreakdown: {}
    },
    performanceStats: {
      totalGames: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      cleanSheets: 0,
      averageRating: 0
    },
    financialStats: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      revenueBreakdown: {},
      expenseBreakdown: {}
    },
    staffStats: {
      totalStaff: 0,
      departmentBreakdown: {}
    }
  });

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [performanceTrends, setPerformanceTrends] = useState<any[]>([]);
  const [financialTrends, setFinancialTrends] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      // Fetch player analytics
      const playersRef = collection(db, 'players');
      const playersSnap = await getDocs(playersRef);
      const players = playersSnap.docs.map(doc => doc.data());

      // Fetch performance analytics
      const performancesRef = collection(db, 'performances');
      const performancesSnap = await getDocs(performancesRef);
      const performances = performancesSnap.docs.map(doc => doc.data());

      // Fetch financial analytics
      const transactionsRef = collection(db, 'transactions');
      const transactionsSnap = await getDocs(transactionsRef);
      const transactions = transactionsSnap.docs.map(doc => doc.data());

      // Fetch staff analytics
      const staffRef = collection(db, 'staff');
      const staffSnap = await getDocs(staffRef);
      const staff = staffSnap.docs.map(doc => doc.data());

      // Calculate analytics
      const analytics: Analytics = {
        playerStats: calculatePlayerStats(players),
        performanceStats: calculatePerformanceStats(performances),
        financialStats: calculateFinancialStats(transactions),
        staffStats: calculateStaffStats(staff)
      };

      setAnalytics(analytics);

      // Add performance trends data
      const performanceData = await fetchPerformanceTrends();
      setPerformanceTrends(performanceData);

      // Add financial trends data
      const financialData = await fetchFinancialTrends();
      setFinancialTrends(financialData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchPerformanceTrends = async () => {
    const performancesRef = collection(db, 'performances');
    const q = query(
      performancesRef,
      where('date', '>=', dateRange.start),
      where('date', '<=', dateRange.end)
    );
    const snapshot = await getDocs(q);
    const performances = snapshot.docs.map(doc => doc.data());

    // Process data for trends
    return performances.reduce((acc: any[], perf) => {
      const date = new Date(perf.date).toLocaleDateString();
      const existing = acc.find(p => p.date === date);
      if (existing) {
        existing.rating = (existing.rating + perf.rating) / 2;
        existing.goals += perf.goals || 0;
      } else {
        acc.push({
          date,
          rating: perf.rating,
          goals: perf.goals || 0
        });
      }
      return acc;
    }, []);
  };

  const fetchFinancialTrends = async () => {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('date', '>=', dateRange.start),
      where('date', '<=', dateRange.end)
    );
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => doc.data());

    // Process data for trends
    return transactions.reduce((acc: any[], trans) => {
      const date = new Date(trans.date).toLocaleDateString();
      const existing = acc.find(t => t.date === date);
      if (existing) {
        if (trans.type === 'Income') {
          existing.income += trans.amount;
        } else {
          existing.expenses += trans.amount;
        }
      } else {
        acc.push({
          date,
          income: trans.type === 'Income' ? trans.amount : 0,
          expenses: trans.type === 'Expense' ? trans.amount : 0
        });
      }
      return acc;
    }, []);
  };

  const handleExport = () => {
    const data = {
      analytics,
      performanceTrends,
      financialTrends,
      exportDate: new Date().toISOString(),
      dateRange
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculatePlayerStats = (players: any[]) => {
    const totalPlayers = players.length;
    const activePlayers = players.filter(p => p.status === 'Active').length;
    const averageAge = players.reduce((sum, p) => {
      const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
      return sum + age;
    }, 0) / totalPlayers;

    const positionBreakdown = players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPlayers,
      activePlayers,
      averageAge,
      positionBreakdown
    };
  };

  const calculatePerformanceStats = (performances: any[]) => {
    const totalGames = performances.length;
    const wins = performances.filter(p => p.result === 'Win').length;
    const draws = performances.filter(p => p.result === 'Draw').length;
    const losses = performances.filter(p => p.result === 'Loss').length;
    const goalsScored = performances.reduce((sum, p) => sum + (p.goalsScored || 0), 0);
    const goalsConceded = performances.reduce((sum, p) => sum + (p.goalsConceded || 0), 0);
    const cleanSheets = performances.filter(p => p.goalsConceded === 0).length;
    const averageRating = performances.reduce((sum, p) => sum + (p.rating || 0), 0) / totalGames;

    return {
      totalGames,
      wins,
      draws,
      losses,
      goalsScored,
      goalsConceded,
      cleanSheets,
      averageRating
    };
  };

  const calculateFinancialStats = (transactions: any[]) => {
    const totalRevenue = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const revenueBreakdown = transactions
      .filter(t => t.type === 'Income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {});

    const expenseBreakdown = transactions
      .filter(t => t.type === 'Expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {});

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      revenueBreakdown,
      expenseBreakdown
    };
  };

  const calculateStaffStats = (staff: any[]) => {
    const totalStaff = staff.length;
    const departmentBreakdown = staff.reduce((acc, s) => {
      acc[s.department] = (acc[s.department] || 0) + 1;
      return acc;
    }, {});

    return {
      totalStaff,
      departmentBreakdown
    };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span>to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Player Statistics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Player Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Players</p>
                <h3 className="text-2xl font-bold">{analytics.playerStats.totalPlayers}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Players</p>
                <h3 className="text-2xl font-bold">{analytics.playerStats.activePlayers}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Age</p>
                <h3 className="text-2xl font-bold">{analytics.playerStats.averageAge.toFixed(1)}</h3>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Performance Statistics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Performance Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Games</p>
                <h3 className="text-2xl font-bold">{analytics.performanceStats.totalGames}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Wins</p>
                <h3 className="text-2xl font-bold">{analytics.performanceStats.wins}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Goals Scored</p>
                <h3 className="text-2xl font-bold">{analytics.performanceStats.goalsScored}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Rating</p>
                <h3 className="text-2xl font-bold">
                  {analytics.performanceStats.averageRating.toFixed(1)}
                </h3>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Financial Statistics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Financial Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold">
                  ${analytics.financialStats.totalRevenue.toLocaleString()}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <h3 className="text-2xl font-bold">
                  ${analytics.financialStats.totalExpenses.toLocaleString()}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Profit</p>
                <h3 className="text-2xl font-bold">
                  ${analytics.financialStats.netProfit.toLocaleString()}
                </h3>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Staff Statistics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Staff Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <h3 className="text-2xl font-bold">{analytics.staffStats.totalStaff}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Department Breakdown</h4>
              {Object.entries(analytics.staffStats.departmentBreakdown).map(([dept, count]) => (
                <div key={dept} className="flex justify-between items-center">
                  <span>{dept}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Performance Trends Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="rating"
                stroke="#8884d8"
                name="Average Rating"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="goals"
                stroke="#82ca9d"
                name="Goals Scored"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Financial Trends Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Financial Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#82ca9d" name="Income" />
              <Bar dataKey="expenses" fill="#ff8042" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Position Distribution Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Squad Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics.playerStats.positionBreakdown).map(([position, count]) => ({
                    name: position,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analytics.playerStats.positionBreakdown).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Department Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics.staffStats.departmentBreakdown).map(([dept, count]) => ({
                    name: dept,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analytics.staffStats.departmentBreakdown).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
} 