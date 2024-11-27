'use client'
import { DataTable } from "@/components/ui/data-table"
import { Card } from "@/components/ui/card"
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { format } from 'date-fns'
import { formatLKR } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  status: 'completed' | 'pending' | 'cancelled'
}

interface CategoryTotal {
  category: string
  total: number
}

const columns = [
  {
    key: 'date',
    label: 'Date',
    sortable: true,
    render: (expense: Expense) => format(new Date(expense.date), 'PP')
  },
  {
    key: 'description',
    label: 'Description',
    sortable: true
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    render: (expense: Expense) => formatLKR(expense.amount)
  }
];

export function ExpensesReport() {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      // Get transactions that are expenses
      const transactionsRef = collection(db, 'transactions')
      const expensesQuery = query(
        transactionsRef,
        where('type', '==', 'expense')
      )
      const querySnapshot = await getDocs(expensesQuery)
      
      const expenseData: Expense[] = []
      const categoryTotalsMap = new Map<string, number>()
      let total = 0

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        
        if (data.status === 'completed') {
          const expense: Expense = {
            id: doc.id,
            date: data.date,
            category: data.category,
            description: data.description,
            amount: Number(data.amount),
            paymentMethod: data.paymentMethod || 'Not specified',
            status: data.status
          }

          expenseData.push(expense)
          
          total += expense.amount
          const currentTotal = categoryTotalsMap.get(data.category) || 0
          categoryTotalsMap.set(data.category, currentTotal + expense.amount)
        }
      })

      const categoryTotalsArray = Array.from(categoryTotalsMap.entries()).map(([category, total]) => ({
        category,
        total
      }))

      setExpenses(expenseData)
      setCategoryTotals(categoryTotalsArray)
      setTotalExpenses(total)
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: categoryTotals.map(ct => ct.category),
    datasets: [{
      data: categoryTotals.map(ct => ct.total),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Total Expenses</span>
              <span className="font-bold">{formatLKR(totalExpenses)}</span>
            </div>
            {categoryTotals.map((ct) => (
              <div key={ct.category} className="flex justify-between">
                <span>{ct.category}</span>
                <span className="font-bold">{formatLKR(ct.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Expense Transactions</h2>
        <DataTable columns={columns} data={expenses} />
      </Card>
    </div>
  )
} 