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
  Target
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
  Cell
} from 'recharts';

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
  };
  performance: {
    totalGames: number;
    wins: number;
    draws: number;
    losses: number;
    recentPerformances: any[];
  };
  staff: {
    total: number;
    byDepartment: Record<string, number>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    players: { total: 0, active: 0, byPosition: {} },
    finances: { revenue: 0, expenses: 0, netProfit: 0, growth: 0 },
    performance: { totalGames: 0, wins: 0, draws: 0, losses: 0, recentPerformances: [] },
    staff: { total: 0, byDepartment: {} }
  });

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

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

      // Fetch performance stats
      const performancesRef = collection(db, 'performances');
      const recentPerformancesQuery = query(
        performancesRef,
        orderBy('date', 'desc'),
        limit(5)
      );
      const performancesSnap = await getDocs(recentPerformancesQuery);
      const performances = performancesSnap.docs.map(doc => doc.data());

      const performanceStats = {
        totalGames: performances.length,
        wins: performances.filter(p => p.result === 'Win').length,
        draws: performances.filter(p => p.result === 'Draw').length,
        losses: performances.filter(p => p.result === 'Loss').length,
        recentPerformances: performances
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
          growth
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome, {user.email?.split('@')[0]}</h1>
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
                ${(stats.finances.revenue / 1000000).toFixed(1)}M
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
                ${(stats.finances.expenses / 1000).toFixed(0)}K
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Performance</p>
              <h3 className="text-2xl font-bold">
                {stats.performance.wins} W {stats.performance.draws} D {stats.performance.losses} L
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last {stats.performance.totalGames} games
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Performances</h3>
          <div className="space-y-4">
            {stats.performance.recentPerformances.map((performance, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{performance.playerName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(performance.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Rating: {performance.rating?.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">
                    {performance.goals} goals, {performance.assists} assists
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Squad Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(stats.players.byPosition).map(([position, count]) => ({
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
                  {Object.entries(stats.players.byPosition).map((entry, index) => (
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
