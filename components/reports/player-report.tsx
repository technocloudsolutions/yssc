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
import { Pie } from 'react-chartjs-2'
import { formatLKR } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PlayerPayment {
  id: string
  playerName: string
  totalDue: number
  amountPaid: number
  remaining: number
  status: 'paid' | 'partial' | 'pending'
  lastPaymentDate: string
}

const columns = [
  {
    key: "playerName",
    label: "Player Name",
    sortable: true
  },
  {
    key: "totalDue",
    label: "Total Due",
    sortable: true,
    cell: ({ row }) => formatLKR(row.original.totalDue),
  },
  {
    key: "amountPaid",
    label: "Amount Paid",
    sortable: true,
    cell: ({ row }) => formatLKR(row.original.amountPaid),
  },
  {
    key: "remaining",
    label: "Remaining",
    sortable: true,
    cell: ({ row }) => formatLKR(row.original.remaining),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    cell: ({ row }) => {
      const statusColors = {
        paid: 'text-green-600',
        partial: 'text-yellow-600',
        pending: 'text-red-600'
      }
      return (
        <span className={statusColors[row.original.status]}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </span>
      )
    },
  },
  {
    key: "lastPaymentDate",
    label: "Last Payment",
    sortable: true
  },
]

export function PlayerReport() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PlayerPayment[]>([])

  // Rest of the component code
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Player Payments</h2>
        <DataTable columns={columns} data={payments} />
      </Card>
    </div>
  )
}