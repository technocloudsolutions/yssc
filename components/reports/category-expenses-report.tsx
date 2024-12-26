'use client';

import { ReportContainer } from "./ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { formatAmount } from "@/lib/utils";

interface CategoryExpense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: string;
}

export function CategoryExpensesReport() {
  const [expenses, setExpenses] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expensesRef = collection(db, 'categoryExpenses');
        const snapshot = await getDocs(expensesRef);
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CategoryExpense[];
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        toast({
          title: "Error",
          description: "Failed to fetch category expenses data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [toast]);

  // Calculate metrics
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoriesCount = new Set(expenses.map(exp => exp.category)).size;
  const averageExpense = totalExpenses / (expenses.length || 1);

  const metrics = [
    {
      label: 'Total Expenses',
      value: formatAmount(totalExpenses),
    },
    {
      label: 'Categories',
      value: categoriesCount,
    },
    {
      label: 'Average Expense',
      value: formatAmount(averageExpense),
    },
    {
      label: 'Total Transactions',
      value: expenses.length,
    }
  ];

  // Prepare chart data
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const colors = [
    'rgba(54, 162, 235, 0.5)',
    'rgba(255, 99, 132, 0.5)',
    'rgba(255, 206, 86, 0.5)',
    'rgba(75, 192, 192, 0.5)',
    'rgba(153, 102, 255, 0.5)',
  ];

  const borderColors = [
    'rgba(54, 162, 235, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
  ];

  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: 'Category Expenses',
        data: Object.values(categoryTotals),
        backgroundColor: colors[0],
        borderColor: borderColors[0],
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: 'Category Expenses',
        data: Object.values(categoryTotals),
        backgroundColor: colors,
        borderColor: borderColors[0],
        borderWidth: 1,
      },
    ],
  };

  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (item: CategoryExpense) => formatAmount(item.amount)
    },
    { key: 'status', label: 'Status', sortable: true },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ReportContainer
      title="Category Expenses Report"
      description="Overview of expenses by category"
      metrics={metrics}
      barChartData={chartData}
      pieChartData={pieChartData}
      tableColumns={columns}
      tableData={expenses}
    />
  );
} 