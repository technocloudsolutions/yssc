'use client';

import { ReportContainer } from "@/components/reports/ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { formatAmount } from "@/lib/utils";

interface ExpenseTransaction {
  id: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  status: string;
  vendor: string;
  recurring: boolean;
  frequency?: 'One-time' | 'Monthly' | 'Quarterly' | 'Annually';
  budgeted: boolean;
  budgetCategory?: string;
  taxDeductible: boolean;
}

export default function ExpenseAnalysisPage() {
  const [expenseTransactions, setExpenseTransactions] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenseTransactions = async () => {
      try {
        const transactionsRef = collection(db, 'transactions');
        const expenseQuery = query(transactionsRef, where("type", "==", "Expense"));
        const snapshot = await getDocs(expenseQuery);
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExpenseTransaction[];
        setExpenseTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching expense transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseTransactions();
  }, []);

  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const recurringExpenses = expenseTransactions
    .filter(t => t.recurring)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const budgetedExpenses = expenseTransactions
    .filter(t => t.budgeted)
    .reduce((sum, t) => sum + t.amount, 0);

  const taxDeductible = expenseTransactions
    .filter(t => t.taxDeductible)
    .reduce((sum, t) => sum + t.amount, 0);

  const metrics = [
    {
      label: 'Total Expenses',
      value: formatAmount(totalExpenses),
      change: 3.2,
      trend: 'up' as const
    },
    {
      label: 'Recurring Expenses',
      value: formatAmount(recurringExpenses),
      change: 0.8,
      trend: 'up' as const
    },
    {
      label: 'Budgeted Amount',
      value: formatAmount(budgetedExpenses),
      change: -2.5,
      trend: 'down' as const
    },
    {
      label: 'Tax Deductible',
      value: formatAmount(taxDeductible),
      change: 5.3,
      trend: 'up' as const
    }
  ];

  // Monthly Expense Trend
  const monthlyData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Total Expenses',
        data: Array.from({ length: 12 }, (_, month) => 
          expenseTransactions
            .filter(t => new Date(t.date).getMonth() === month)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Budgeted Expenses',
        data: Array.from({ length: 12 }, (_, month) => 
          expenseTransactions
            .filter(t => t.budgeted && new Date(t.date).getMonth() === month)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }
    ],
  };

  // Category Distribution
  const categoryData = {
    labels: Array.from(new Set(expenseTransactions.map(t => t.category))),
    datasets: [
      {
        label: 'Expenses by Category',
        data: Array.from(
          expenseTransactions.reduce((acc, t) => {
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

  // Budget vs Actual Trend
  const budgetTrendData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Budget Variance',
        data: Array.from({ length: 12 }, (_, month) => {
          const monthlyExpenses = expenseTransactions
            .filter(t => new Date(t.date).getMonth() === month)
            .reduce((sum, t) => sum + t.amount, 0);
          
          const monthlyBudgeted = expenseTransactions
            .filter(t => t.budgeted && new Date(t.date).getMonth() === month)
            .reduce((sum, t) => sum + t.amount, 0);
          
          return ((monthlyExpenses - monthlyBudgeted) / monthlyBudgeted) * 100;
        }),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const columns = [
    { 
      key: 'date', 
      label: 'Date', 
      sortable: true,
      render: (transaction: ExpenseTransaction) => 
        new Date(transaction.date).toLocaleDateString()
    },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'subcategory', label: 'Subcategory', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (transaction: ExpenseTransaction) => formatAmount(transaction.amount)
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true },
    { 
      key: 'recurring', 
      label: 'Recurring', 
      sortable: true,
      render: (transaction: ExpenseTransaction) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          transaction.recurring ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {transaction.recurring ? 'Yes' : 'No'}
        </div>
      )
    },
    { 
      key: 'budgeted', 
      label: 'Budgeted', 
      sortable: true,
      render: (transaction: ExpenseTransaction) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          transaction.budgeted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {transaction.budgeted ? 'Yes' : 'No'}
        </div>
      )
    },
    { 
      key: 'taxDeductible', 
      label: 'Tax Deductible', 
      sortable: true,
      render: (transaction: ExpenseTransaction) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          transaction.taxDeductible ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {transaction.taxDeductible ? 'Yes' : 'No'}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (transaction: ExpenseTransaction) => (
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
      title="Expense Analysis"
      description="Comprehensive analysis of expenses, budget tracking, and spending patterns"
      metrics={metrics}
      barChartData={monthlyData}
      pieChartData={categoryData}
      lineChartData={budgetTrendData}
      tableColumns={columns}
      tableData={expenseTransactions}
    />
  );
} 