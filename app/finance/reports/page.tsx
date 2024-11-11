'use client';

import { useState, useEffect } from 'react';
import { useDataOperations } from '@/hooks/useDataOperations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collection } from '@/hooks/useDataOperations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
export default function FinanceReportsPage() {
  const { items: transactions } = useDataOperations('transactions' as Collection);
  const { items: accountTypes } = useDataOperations('accountTypes' as Collection);
  const { items: categories } = useDataOperations('categories' as Collection);
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    end: new Date().toISOString().split('T')[0], // Today
  });

  useEffect(() => {
    const filtered = transactions.filter(t => 
      t.date >= dateRange.start && t.date <= dateRange.end
    );
    setFilteredTransactions(filtered);
  }, [transactions, dateRange]);

  // Calculate summaries
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netIncome = totalIncome - totalExpense;

  // Group transactions by account type
  const accountTypeSummary = accountTypes.map(type => ({
    name: type.name,
    total: filteredTransactions
      .filter(t => t.accountType === type.name)
      .reduce((sum, t) => sum + Number(t.amount), 0),
  }));

  // Group transactions by category
  const categorySummary = categories.map(cat => ({
    name: cat.name,
    type: cat.type,
    total: filteredTransactions
      .filter(t => t.category === cat.id)
      .reduce((sum, t) => sum + Number(t.amount), 0),
  }));

  // Chart data for Income vs Expense
  const incomeVsExpenseData = {
    labels: ['Income', 'Expense', 'Net Income'],
    datasets: [
      {
        label: 'Amount',
        data: [totalIncome, totalExpense, netIncome],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
        ],
      },
    ],
  };

  // Chart data for Account Types
  const accountTypeData = {
    labels: accountTypeSummary.map(a => a.name),
    datasets: [
      {
        data: accountTypeSummary.map(a => a.total),
        backgroundColor: accountTypeSummary.map(
          (_, i) => `hsl(${(i * 360) / accountTypeSummary.length}, 70%, 50%, 0.5)`
        ),
      },
    ],
  };

  // Chart data for Categories
  const categoryData = {
    labels: categorySummary
      .filter(cat => cat.total > 0)
      .map(c => c.name),
    datasets: [
      {
        label: 'Income',
        data: categorySummary
          .filter(cat => cat.type === 'Income' && cat.total > 0)
          .map(c => c.total),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Expense',
        data: categorySummary
          .filter(cat => cat.type === 'Expense' && cat.total > 0)
          .map(c => c.total),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  // Monthly trend data
  const monthlyData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Income',
        data: Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return filteredTransactions
            .filter(t => 
              t.type === 'Income' && 
              new Date(t.date).getMonth() === i
            )
            .reduce((sum, t) => sum + Number(t.amount), 0);
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Expense',
        data: Array.from({ length: 12 }, (_, i) => {
          return filteredTransactions
            .filter(t => 
              t.type === 'Expense' && 
              new Date(t.date).getMonth() === i
            )
            .reduce((sum, t) => sum + Number(t.amount), 0);
        }),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const exportReport = (type: string) => {
    let data: string[][] = [];
    let filename = '';

    switch (type) {
      case 'summary':
        data = [
          ['Report Type', 'Amount'],
          ['Total Income', totalIncome.toString()],
          ['Total Expense', totalExpense.toString()],
          ['Net Income', netIncome.toString()],
        ];
        filename = 'financial-summary';
        break;
      case 'account-types':
        data = [
          ['Account Type', 'Total Amount'],
          ...accountTypeSummary.map(a => [a.name, a.total.toString()]),
        ];
        filename = 'account-type-summary';
        break;
      case 'categories':
        data = [
          ['Category', 'Type', 'Total Amount'],
          ...categorySummary.map(c => [c.name, c.type, c.total.toString()]),
        ];
        filename = 'category-summary';
        break;
    }

    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex gap-4">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-green-600">Total Income</h3>
          <p className="text-2xl font-bold">${totalIncome.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-red-600">Total Expense</h3>
          <p className="text-2xl font-bold">${totalExpense.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-blue-600">Net Income</h3>
          <p className="text-2xl font-bold">${netIncome.toLocaleString()}</p>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="account-types">Account Types</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Income vs Expense Overview</h3>
              <Button variant="outline" onClick={() => exportReport('summary')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[400px]">
              <Bar data={incomeVsExpenseData} options={{ maintainAspectRatio: false }} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="account-types">
          <Card className="p-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Account Type Distribution</h3>
              <Button variant="outline" onClick={() => exportReport('account-types')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[400px]">
              <Pie data={accountTypeData} options={{ maintainAspectRatio: false }} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="p-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Category-wise Analysis</h3>
              <Button variant="outline" onClick={() => exportReport('categories')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[400px]">
              <Bar data={categoryData} options={{ maintainAspectRatio: false }} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="p-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Trend Analysis</h3>
              <Button variant="outline" onClick={() => exportReport('transactions')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[400px]">
              <Line data={monthlyData} options={{ maintainAspectRatio: false }} />
            </div>
          </Card>

          <Card className="mt-4 p-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Transaction Details</h3>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                  onChange={(e) => {
                    const type = e.target.value;
                    const filtered = type === 'all' 
                      ? transactions 
                      : transactions.filter(t => t.type.toLowerCase() === type);
                    setFilteredTransactions(filtered);
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expense Only</option>
                </select>
                <select
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    const filtered = categoryId === 'all'
                      ? transactions
                      : transactions.filter(t => t.category === categoryId);
                    setFilteredTransactions(filtered);
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Account Type</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id} 
                      className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
                    >
                      <td className="p-2">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className={`p-2 ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type}
                      </td>
                      <td className="p-2">
                        {categories.find(c => c.id === transaction.category)?.name || '-'}
                      </td>
                      <td className="p-2">{transaction.accountType}</td>
                      <td className="p-2 text-right font-semibold">
                        ${Number(transaction.amount).toLocaleString()}
                      </td>
                      <td className="p-2">{transaction.paymentMethod}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 