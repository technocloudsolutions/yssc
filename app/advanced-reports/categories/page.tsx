'use client';

import { ReportContainer } from "@/components/reports/ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { formatAmount } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  type: 'Income' | 'Expense';
  description: string;
  budgetLimit?: number;
  parentCategory?: string;
  status: 'Active' | 'Inactive';
  tags?: string[];
}

interface CategoryTransaction {
  id: string;
  categoryId: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  description: string;
  budgeted: boolean;
  variance?: number;
}

export default function CategoryAnalysisPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<CategoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        // Fetch categories
        const categoriesRef = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        setCategories(categoriesData);

        // Fetch transactions
        const transactionsRef = collection(db, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CategoryTransaction[];
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeCategories = categories.filter(c => c.status === 'Active').length;
  
  const budgetVariance = transactions
    .filter(t => t.budgeted && t.variance)
    .reduce((sum, t) => sum + (t.variance || 0), 0);

  const metrics = [
    {
      label: 'Total Categories',
      value: categories.length,
      change: 2,
      trend: 'up' as const
    },
    {
      label: 'Active Categories',
      value: activeCategories,
      change: 0,
      trend: 'neutral' as const
    },
    {
      label: 'Net Impact',
      value: formatAmount(totalIncome - totalExpenses),
      change: 5.3,
      trend: 'up' as const
    },
    {
      label: 'Budget Variance',
      value: formatAmount(budgetVariance),
      change: -2.1,
      trend: 'down' as const
    }
  ];

  // Category Distribution
  const categoryData = {
    labels: categories.map(c => c.name),
    datasets: [
      {
        label: 'Transaction Volume',
        data: categories.map(category => 
          transactions
            .filter(t => t.categoryId === category.id)
            .reduce((sum, t) => sum + t.amount, 0)
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

  // Monthly Category Trends
  const monthlyData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: categories.slice(0, 5).map((category, index) => ({
      label: category.name,
      data: Array.from({ length: 12 }, (_, month) =>
        transactions
          .filter(t => 
            t.categoryId === category.id && 
            new Date(t.date).getMonth() === month
          )
          .reduce((sum, t) => sum + t.amount, 0)
      ),
      backgroundColor: `rgba(${index * 50}, 192, 192, 0.5)`,
    })),
  };

  // Budget vs Actual by Category
  const budgetVarianceData = {
    labels: categories.map(c => c.name),
    datasets: [
      {
        label: 'Budget Variance %',
        data: categories.map(category => {
          const categoryTransactions = transactions.filter(t => t.categoryId === category.id);
          const actual = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
          const budgetLimit = category.budgetLimit || 0;
          return budgetLimit > 0 ? ((actual - budgetLimit) / budgetLimit) * 100 : 0;
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const columns = [
    { key: 'name', label: 'Category Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { 
      key: 'totalAmount', 
      label: 'Total Amount', 
      sortable: true,
      render: (category: Category) => formatAmount(
        transactions
          .filter(t => t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0)
      )
    },
    { 
      key: 'budgetLimit', 
      label: 'Budget Limit', 
      sortable: true,
      render: (category: Category) => 
        category.budgetLimit ? formatAmount(category.budgetLimit) : '-'
    },
    { 
      key: 'variance', 
      label: 'Variance', 
      sortable: true,
      render: (category: Category) => {
        const actual = transactions
          .filter(t => t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0);
        const variance = category.budgetLimit 
          ? actual - category.budgetLimit
          : 0;
        return (
          <div className={`px-2 py-1 rounded-full text-xs ${
            variance > 0 ? 'bg-red-100 text-red-800' :
            variance < 0 ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {formatAmount(variance)}
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (category: Category) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          category.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {category.status}
        </div>
      )
    },
    { 
      key: 'transactionCount', 
      label: 'Transactions', 
      sortable: true,
      render: (category: Category) =>
        transactions.filter(t => t.categoryId === category.id).length
    },
    { 
      key: 'tags', 
      label: 'Tags', 
      sortable: true,
      render: (category: Category) => (
        <div className="flex gap-1 flex-wrap">
          {category.tags?.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ReportContainer
      title="Category Analysis"
      description="Detailed analysis of financial categories, budget impact, and transaction patterns"
      metrics={metrics}
      barChartData={monthlyData}
      pieChartData={categoryData}
      lineChartData={budgetVarianceData}
      tableColumns={columns}
      tableData={categories}
    />
  );
} 