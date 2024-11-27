'use client'
import { DataTable } from "@/components/ui/data-table"
import { Card } from "@/components/ui/card"
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatLKR } from '@/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  status: 'completed' | 'pending' | 'cancelled'
}

const columns = [
  {
    key: "date",
    label: "Date",
    sortable: true
  },
  {
    key: "type",
    label: "Type",
    sortable: true,
    cell: ({ row }) => (
      <span className={row.original.type === 'income' ? 'text-green-600' : 'text-red-600'}>
        {row.original.type.charAt(0).toUpperCase() + row.original.type.slice(1)}
      </span>
    ),
  },
  {
    key: "category",
    label: "Category",
    sortable: true
  },
  {
    key: "description",
    label: "Description",
    sortable: true
  },
  {
    key: "amount",
    label: "Amount",
    sortable: true,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.amount.toString())
      return (
        <span className={row.original.type === 'income' ? 'text-green-600' : 'text-red-600'}>
          {formatLKR(amount)}
        </span>
      )
    },
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    cell: ({ row }) => {
      const status = row.original.status
      const statusClasses = {
        completed: 'text-green-600',
        pending: 'text-yellow-600',
        cancelled: 'text-red-600'
      }
      return (
        <span className={statusClasses[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
]

export function FinanceReport() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyData, setMonthlyData] = useState({
    labels: [] as string[],
    incomeData: [] as number[],
    expenseData: [] as number[],
  })

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      // Get all transactions (both income and expenses)
      const transactionsRef = collection(db, 'transactions')
      const querySnapshot = await getDocs(transactionsRef)
      
      console.log('Raw Firestore Data:', querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })))

      const transactionData: Transaction[] = []
      const monthlyIncome = new Map<string, number>()
      const monthlyExpense = new Map<string, number>()

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Raw Transaction:', data) // Debug log

        // Convert type and status to lowercase for consistent comparison
        const type = data.type?.toLowerCase()
        const status = data.status?.toLowerCase()

        // Check if this is a valid transaction
        if (data.date && type && data.amount) {
          const transaction: Transaction = {
            id: doc.id,
            date: data.date,
            type: type === 'income' ? 'income' : 'expense',
            category: data.category || 'Uncategorized',
            description: data.description || '',
            amount: Number(data.amount),
            status: (status || 'pending') as 'completed' | 'pending' | 'cancelled'
          }
          
          console.log('Processed Transaction:', transaction) // Debug log
          transactionData.push(transaction)

          if (status === 'completed') {
            const monthYear = data.date.substring(0, 7)
            
            if (type === 'income') {
              const current = monthlyIncome.get(monthYear) || 0
              monthlyIncome.set(monthYear, current + Number(data.amount))
            } else if (type === 'expense') {
              const current = monthlyExpense.get(monthYear) || 0
              monthlyExpense.set(monthYear, current + Number(data.amount))
            }
          }
        } else {
          console.warn('Invalid transaction data:', data) // Debug log for invalid data
        }
      })

      console.log('Processed Transactions:', transactionData) // Debug log
      console.log('Monthly Income:', monthlyIncome) // Debug log
      console.log('Monthly Expenses:', monthlyExpense) // Debug log

      // Sort months and prepare chart data
      const allMonths = Array.from(new Set([
        ...monthlyIncome.keys(),
        ...monthlyExpense.keys()
      ])).sort()

      const chartData = {
        labels: allMonths.map(m => {
          const [year, month] = m.split('-')
          return new Date(parseInt(year), parseInt(month) - 1)
            .toLocaleString('default', { month: 'short', year: '2-digit' })
        }),
        incomeData: allMonths.map(m => monthlyIncome.get(m) || 0),
        expenseData: allMonths.map(m => monthlyExpense.get(m) || 0),
      }

      console.log('Chart Data:', chartData) // Debug log

      setTransactions(transactionData)
      setMonthlyData(chartData)
    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = totalIncome - totalExpenses

  const chartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Income',
        data: monthlyData.incomeData,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Expenses',
        data: monthlyData.expenseData,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (LKR)',
        },
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
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Payee Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
            <p className="text-2xl font-bold text-green-600">{formatLKR(totalIncome)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-600">{formatLKR(totalExpenses)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatLKR(netBalance)}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Income vs Expenses</h2>
          <div className="h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <DataTable columns={columns} data={transactions} />
        </Card>
      </div>
    </Card>
  )
} 