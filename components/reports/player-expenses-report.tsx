'use client';

import { ReportContainer } from "./ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { formatAmount } from "@/lib/utils";

interface PlayerExpense {
  id: string;
  playerName: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  status: string;
}

export function PlayerExpensesReport() {
  const [expenses, setExpenses] = useState<PlayerExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expensesRef = collection(db, 'playerExpenses');
        const snapshot = await getDocs(expensesRef);
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PlayerExpense[];
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        toast({
          title: "Error",
          description: "Failed to fetch player expenses data",
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
  const playersCount = new Set(expenses.map(exp => exp.playerName)).size;
  const averageExpense = totalExpenses / (expenses.length || 1);

  const metrics = [
    {
      label: 'Total Expenses',
      value: formatAmount(totalExpenses),
    },
    {
      label: 'Players',
      value: playersCount,
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
  const playerTotals = expenses.reduce((acc, exp) => {
    acc[exp.playerName] = (acc[exp.playerName] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(playerTotals),
    datasets: [
      {
        label: 'Player Expenses',
        data: Object.values(playerTotals),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'playerName', label: 'Player', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (item: PlayerExpense) => formatAmount(item.amount)
    },
    { key: 'status', label: 'Status', sortable: true },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ReportContainer
      title="Player Expenses Report"
      description="Overview of expenses by player"
      metrics={metrics}
      barChartData={chartData}
      pieChartData={chartData}
      tableColumns={columns}
      tableData={expenses}
    />
  );
} 