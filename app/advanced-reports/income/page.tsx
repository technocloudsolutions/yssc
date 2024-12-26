'use client';

import { ReportContainer } from "@/components/reports/ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { formatAmount } from "@/lib/utils";

interface IncomeTransaction {
  id: string;
  source: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  status: string;
  payer: string;
  recurring: boolean;
  frequency?: 'One-time' | 'Monthly' | 'Quarterly' | 'Annually';
}

export default function IncomeAnalysisPage() {
  const [incomeTransactions, setIncomeTransactions] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncomeTransactions = async () => {
      try {
        const transactionsRef = collection(db, 'transactions');
        const incomeQuery = query(transactionsRef, where("type", "==", "Income"));
        const snapshot = await getDocs(incomeQuery);
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IncomeTransaction[];
        setIncomeTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching income transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeTransactions();
  }, []);

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const recurringIncome = incomeTransactions
    .filter(t => t.recurring)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const averageTransactionValue = totalIncome / incomeTransactions.length || 0;

  const metrics = [
    {
      label: 'Total Income',
      value: formatAmount(totalIncome),
      change: 8.5,
      trend: 'up' as const
    },
    {
      label: 'Recurring Income',
      value: formatAmount(recurringIncome),
      change: 5.2,
      trend: 'up' as const
    },
    {
      label: 'Average Transaction',
      value: formatAmount(averageTransactionValue),
      change: 3.1,
      trend: 'up' as const
    },
    {
      label: 'Active Sources',
      value: new Set(incomeTransactions.map(t => t.source)).size,
      change: 1,
      trend: 'up' as const
    }
  ];

  // Monthly Income Trend
  const monthlyData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Total Income',
        data: Array.from({ length: 12 }, (_, month) => 
          incomeTransactions
            .filter(t => new Date(t.date).getMonth() === month)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Recurring Income',
        data: Array.from({ length: 12 }, (_, month) => 
          incomeTransactions
            .filter(t => t.recurring && new Date(t.date).getMonth() === month)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }
    ],
  };

  // Income Sources Distribution
  const sourceData = {
    labels: Array.from(new Set(incomeTransactions.map(t => t.source))),
    datasets: [
      {
        label: 'Income by Source',
        data: Array.from(
          incomeTransactions.reduce((acc, t) => {
            acc.set(t.source, (acc.get(t.source) || 0) + t.amount);
            return acc;
          }, new Map<string, number>()),
          ([_, amount]) => amount
        ),
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  // Income Growth Trend
  const growthData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Monthly Growth Rate',
        data: Array.from({ length: 12 }, (_, month) => {
          const currentMonth = incomeTransactions
            .filter(t => new Date(t.date).getMonth() === month)
            .reduce((sum, t) => sum + t.amount, 0);
          
          const previousMonth = incomeTransactions
            .filter(t => new Date(t.date).getMonth() === (month - 1 + 12) % 12)
            .reduce((sum, t) => sum + t.amount, 0);
          
          return previousMonth === 0 ? 0 : ((currentMonth - previousMonth) / previousMonth) * 100;
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
      render: (transaction: IncomeTransaction) => 
        new Date(transaction.date).toLocaleDateString()
    },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (transaction: IncomeTransaction) => formatAmount(transaction.amount)
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'payer', label: 'Payer', sortable: true },
    { 
      key: 'recurring', 
      label: 'Recurring', 
      sortable: true,
      render: (transaction: IncomeTransaction) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          transaction.recurring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {transaction.recurring ? 'Yes' : 'No'}
        </div>
      )
    },
    { key: 'frequency', label: 'Frequency', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (transaction: IncomeTransaction) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
          transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {transaction.status}
        </div>
      )
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ReportContainer
      title="Income Analysis"
      description="Detailed analysis of income sources, trends, and recurring revenue"
      metrics={metrics}
      barChartData={monthlyData}
      pieChartData={sourceData}
      lineChartData={growthData}
      tableColumns={columns}
      tableData={incomeTransactions}
    />
  );
} 