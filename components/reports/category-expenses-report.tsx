'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerExpensesTable } from "./player-expenses-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Printer, Download } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryExpense {
  id: string;
  category: string;
  date: string;
  amount: number;
  payee: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  paymentMethod: string;
  type: 'Income' | 'Expense';
}

export function CategoryExpensesReport() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<CategoryExpense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const expensesRef = collection(db, 'transactions');
      const expensesQuery = query(
        expensesRef,
        where('type', '==', 'Expense')
      );
      
      const querySnapshot = await getDocs(expensesQuery);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CategoryExpense[];

      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || expense.status === selectedStatus;
    const matchesDateRange = !dateRange?.from || !dateRange?.to || (
      new Date(expense.date) >= dateRange.from &&
      new Date(expense.date) <= dateRange.to
    );

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const formatAmount = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatAmountForCSV = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Group expenses by category and calculate totals
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = {
        category,
        totalAmount: 0,
        count: 0,
        expenses: []
      };
    }
    acc[category].totalAmount += Number(expense.amount || 0);
    acc[category].count += 1;
    acc[category].expenses.push(expense);
    return acc;
  }, {} as Record<string, { category: string; totalAmount: number; count: number; expenses: CategoryExpense[] }>);

  const columns = [
    {
      key: "category",
      label: "Category",
      sortable: true
    },
    {
      key: "count",
      label: "Number of Transactions",
      sortable: true
    },
    {
      key: "totalAmount",
      label: "Total Amount (LKR)",
      sortable: true,
      render: (item: any) => formatAmount(item.totalAmount)
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (item: any) => (
        <div className="flex justify-end space-x-2">
          <Button 
            onClick={() => handlePrint(item)}
            variant="outline"
            size="sm"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => handleExport(item)}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const handlePrint = (categoryData: any) => {
    const { category, expenses, totalAmount } = categoryData;
    
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <html>
        <head>
          <title>Category Expense Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .content {
              max-width: 800px;
              margin: 0 auto;
            }
            .summary {
              margin-bottom: 20px;
              padding: 15px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .total-row {
              font-weight: bold;
              background-color: #f8f8f8;
            }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="header">
              <h1>Category Expense Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="summary">
              <h2>Category: ${category}</h2>
              <p>Total Amount: ${formatAmount(totalAmount)}</p>
              <p>Number of Transactions: ${expenses.length}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payee</th>
                  <th>Description</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.map(expense => `
                  <tr>
                    <td>${expense.date}</td>
                    <td>${formatAmount(expense.amount)}</td>
                    <td>${expense.payee}</td>
                    <td>${expense.description || ''}</td>
                    <td>${expense.paymentMethod}</td>
                    <td>${expense.status}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td>Total</td>
                  <td>${formatAmount(totalAmount)}</td>
                  <td colspan="4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleExport = (categoryData: any) => {
    const { category, expenses, totalAmount } = categoryData;
    
    const csv = [
      ['Category Expense Report'],
      [`Category: ${category}`],
      [`Total Amount: ${formatAmountForCSV(totalAmount)}`],
      [`Number of Transactions: ${expenses.length}`],
      [],
      ['Date', 'Amount', 'Payee', 'Description', 'Payment Method', 'Status'],
      ...expenses.map(expense => [
        expense.date,
        formatAmountForCSV(Number(expense.amount || 0)),
        expense.payee,
        expense.description || '',
        expense.paymentMethod || '',
        expense.status || ''
      ]),
      [],
      ['TOTAL', formatAmountForCSV(totalAmount), '', '', '', '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `category-expense-${category}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setDateRange(undefined);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search by category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-[250px]">
              <Select
                value={selectedStatus || "all"}
                onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-auto">
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>

            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full md:w-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="mt-6">
            <PlayerExpensesTable
              columns={columns}
              data={Object.values(categoryTotals)}
              pageSize={10}
            />
          </div>
        )}
      </Card>
    </div>
  );
} 