'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  DollarSign, 
  Users, 
  TrendingUp,
  Calendar,
  Award,
  Activity,
  Target,
  Clock,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar as RechartsBar
} from 'recharts';
import { format } from 'date-fns';
import Image from 'next/image';

interface DashboardStats {
  players: {
    total: number;
    active: number;
    byPosition: Record<string, number>;
  };
  finances: {
    revenue: number;
    expenses: number;
    netProfit: number;
    growth: number;
    totalBalance: number;
    activeAccounts: number;
    lastTransactionDate: string;
    playerIncome: number;
    averagePlayerIncome: number;
  };
  performance: {
    totalGames: number;
    wins: number;
    draws: number;
    losses: number;
  };
  staff: {
    total: number;
    byDepartment: Record<string, number>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const getSriLankaTime = () => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };
  return new Date().toLocaleTimeString('en-US', options);
};

interface BankAccount {
  id: string;
  balance?: number;
  status?: string;
  name: string;
  transactions?: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    date: string;
    receivedFrom?: string;
    receivedFromType?: string;
    category?: string;
    status?: string;
    paymentMethod?: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    players: { total: 0, active: 0, byPosition: {} },
    finances: { revenue: 0, expenses: 0, netProfit: 0, growth: 0, totalBalance: 0, activeAccounts: 0, lastTransactionDate: '', playerIncome: 0, averagePlayerIncome: 0 },
    performance: { totalGames: 0, wins: 0, draws: 0, losses: 0 },
    staff: { total: 0, byDepartment: {} }
  });

  const [currentTime, setCurrentTime] = useState(getSriLankaTime());
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString('en-US', {
      timeZone: 'Asia/Colombo',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  );

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getSriLankaTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch players stats
      const playersRef = collection(db, 'players');
      const playersSnap = await getDocs(playersRef);
      const players = playersSnap.docs.map(doc => doc.data());
      
      const playerStats = {
        total: players.length,
        active: players.filter(p => p.status === 'Active').length,
        byPosition: players.reduce((acc, p) => {
          acc[p.position] = (acc[p.position] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      // Fetch bank accounts
      const accountTypesRef = collection(db, 'accountTypes');
      const accountTypesSnap = await getDocs(accountTypesRef);
      const bankAccounts = accountTypesSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        balance: doc.data().balance,
        status: doc.data().status,
        transactions: doc.data().transactions
      })) as BankAccount[];

      const totalBalance = bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      const activeAccounts = bankAccounts.filter(account => account.status === 'Active').length;

      // Get latest transaction date
      const latestTransaction = bankAccounts
        .flatMap(account => account.transactions || [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const lastTransactionDate = latestTransaction?.date 
        ? new Date(latestTransaction.date).toISOString()
        : new Date().toISOString();

      // Fetch financial stats
      const transactionsRef = collection(db, 'transactions');
      const transactionsSnap = await getDocs(transactionsRef);
      const transactions = transactionsSnap.docs.map(doc => doc.data());

      const revenue = transactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const expenses = transactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const netProfit = revenue - expenses;
      const growth = revenue > 0 ? ((netProfit / revenue) * 100) : 0;

      // Calculate player income (40% of revenue)
      const playerIncome = revenue * 0.4;
      const averagePlayerIncome = playerStats.total > 0 ? playerIncome / playerStats.total : 0;

      // Fetch performance stats
      const performancesRef = collection(db, 'performances');

      // First, get total games count without limit
      const totalGamesQuery = query(performancesRef);
      const totalGamesSnap = await getDocs(totalGamesQuery);
      const totalGames = totalGamesSnap.size;

      // Then get recent performances for W/D/L stats
      const recentPerformancesQuery = query(
        performancesRef,
        orderBy('date', 'desc')
      );
      const performancesSnap = await getDocs(recentPerformancesQuery);
      const performances = performancesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          result: data.result || 'Draw'
        };
      });

      const performanceStats = {
        totalGames: totalGames, // Use the total count here
        wins: performances.filter(p => p.result === 'Win').length,
        draws: performances.filter(p => p.result === 'Draw').length,
        losses: performances.filter(p => p.result === 'Loss').length
      };

      // Fetch staff stats
      const staffRef = collection(db, 'staff');
      const staffSnap = await getDocs(staffRef);
      const staff = staffSnap.docs.map(doc => doc.data());

      const staffStats = {
        total: staff.length,
        byDepartment: staff.reduce((acc, s) => {
          acc[s.department] = (acc[s.department] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      setStats({
        players: playerStats,
        finances: {
          revenue,
          expenses,
          netProfit,
          growth,
          totalBalance,
          activeAccounts,
          lastTransactionDate,
          playerIncome,
          averagePlayerIncome
        },
        performance: performanceStats,
        staff: staffStats
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <Image 
          src="/logo.png"
          alt="YSSC Logo"
          width={40}
          height={40}
        />
        <h1 className="text-2xl font-semibold">Young Silver Sports Club Dashboard</h1>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.email?.split('@')[0]}</h1>
          <div className="text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              <span>{currentDate}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Players</p>
              <h3 className="text-2xl font-bold">{stats.players.total}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.players.active} active
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
              <h3 className="text-2xl font-bold">
                LKR {(stats.finances.revenue / 1000000).toFixed(1)}M
              </h3>
              <p className="text-sm text-green-500">
                +{stats.finances.growth.toFixed(1)}% growth
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <BarChart className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expenses</p>
              <h3 className="text-2xl font-bold">
                LKR {(stats.finances.expenses / 1000).toFixed(0)}K
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Performance Overview</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <h3 className="text-xl font-bold">{stats.performance.totalGames}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Games</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{stats.players.total}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Players</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span className={`font-medium ${stats.performance.wins > stats.performance.losses ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.performance.wins}W {stats.performance.draws}D {stats.performance.losses}L
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank Accounts Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bank Accounts</h3>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Balance</span>
              <span className="text-lg font-semibold text-green-600">
                LKR {(stats.finances.totalBalance / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Accounts</span>
              <span className="text-lg font-semibold text-blue-600">
                {stats.finances.activeAccounts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Transaction</span>
              <span className="text-sm text-muted-foreground">
                {(() => {
                  try {
                    const date = new Date(stats.finances.lastTransactionDate);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  } catch (error) {
                    return 'No recent transactions';
                  }
                })()}
              </span>
            </div>
          </div>
        </Card>

        {/* Finance Management Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Finance Management</h3>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <span className="text-lg font-semibold text-green-600">
                LKR {(stats.finances.revenue / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="text-lg font-semibold text-red-600">
                LKR {(stats.finances.expenses / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="h-[150px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={[
                    {
                      name: 'Income',
                      value: stats.finances.revenue,
                      fill: '#10B981' // green-600
                    },
                    {
                      name: 'Expenses',
                      value: stats.finances.expenses,
                      fill: '#EF4444' // red-600
                    }
                  ]}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => `LKR ${(value / 1000).toFixed(0)}K`}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      padding: '0.5rem'
                    }}
                    labelStyle={{ color: '#D1D5DB' }}
                  />
                  <RechartsBar dataKey="value" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Player Income Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Player Income</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Players</span>
              <span className="text-lg font-semibold">{stats.players.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Income</span>
              <span className="text-lg font-semibold text-green-600">
                LKR {(stats.finances.playerIncome / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average/Player</span>
              <span className="text-lg font-semibold text-blue-600">
                LKR {(stats.finances.averagePlayerIncome / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
