'use client';

import { ReportContainer } from "@/components/reports/ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { formatAmount } from "@/lib/utils";

interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  status: string;
  reference: string;
}

export default function FinancialOverviewPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactionsRef = collection(db, 'transactions');
        const snapshot = await getDocs(transactionsRef);
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const metrics = [
    {
      label: 'Total Revenue',
      value: formatAmount(totalIncome),
      change: 8.5,
      trend: 'up' as const
    },
    {
      label: 'Total Expenses',
      value: formatAmount(totalExpenses),
      change: 3.2,
      trend: 'up' as const
    },
    {
      label: 'Net Profit',
      value: formatAmount(netProfit),
      change: 12.3,
      trend: 'up' as const
    },
    {
      label: 'Profit Margin',
      value: `${profitMargin.toFixed(1)}%`,
      change: 2.1,
      trend: 'up' as const
    }
  ];

  // Monthly Revenue vs Expenses
  const monthlyData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Revenue',
        data: Array.from({ length: 12 }, (_, month) => 
          transactions
            .filter(t => 
              t.type === 'Income' && 
              new Date(t.date).getMonth() === month
            )
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Expenses',
        data: Array.from({ length: 12 }, (_, month) => 
          transactions
            .filter(t => 
              t.type === 'Expense' && 
              new Date(t.date).getMonth() === month
            )
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  // Category Distribution
  const categoryData = {
    labels: Array.from(new Set(transactions.map(t => t.category))),
    datasets: [
      {
        label: 'Amount by Category',
        data: Array.from(
          transactions.reduce((acc, t) => {
            acc.set(t.category, (acc.get(t.category) || 0) + t.amount);
            return acc;
          }, new Map<string, number>()),
          ([_, amount]) => amount
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  // Profit Trend
  const profitTrendData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Monthly Profit',
        data: Array.from({ length: 12 }, (_, month) => {
          const monthlyIncome = transactions
            .filter(t => 
              t.type === 'Income' && 
              new Date(t.date).getMonth() === month
            )
            .reduce((sum, t) => sum + t.amount, 0);
          
          const monthlyExpense = transactions
            .filter(t => 
              t.type === 'Expense' && 
              new Date(t.date).getMonth() === month
            )
            .reduce((sum, t) => sum + t.amount, 0);
          
          return monthlyIncome - monthlyExpense;
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const columns = [
    { 
      key: 'date', 
      label: 'Date', 
      sortable: true,
      render: (transaction: Transaction) => 
        new Date(transaction.date).toLocaleDateString()
    },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (transaction: Transaction) => formatAmount(transaction.amount)
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'paymentMethod', label: 'Payment Method', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (transaction: Transaction) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
          transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {transaction.status}
        </div>
      )
    },
    { key: 'reference', label: 'Reference', sortable: true },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ReportContainer
      title="Financial Overview"
      description="Comprehensive analysis of revenue, expenses, and profit metrics"
      metrics={metrics}
      barChartData={monthlyData}
      pieChartData={categoryData}
      lineChartData={profitTrendData}
      tableColumns={columns}
      tableData={transactions}
    />
  );
} 