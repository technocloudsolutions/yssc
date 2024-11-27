'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerExpensesTable } from "./player-expenses-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Printer, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDays } from "date-fns";

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  render?: (item: any) => React.ReactNode;
}

interface PlayerExpense {
  id: string;
  payee: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  paymentMethod: string;
  type: 'Income' | 'Expense';
}

export function PlayerExpensesReport() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<PlayerExpense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<PlayerExpense | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (expenses.length > 0) {
      const uniqueCategories = [...new Set(expenses.map(expense => expense.category))];
      setCategories(uniqueCategories);
    }
  }, [expenses]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const expensesRef = collection(db, 'transactions');
      const expensesQuery = query(
        expensesRef,
        where('type', '==', 'Expense'),
        where('payeeType', '==', 'Player')
      );
      
      const querySnapshot = await getDocs(expensesQuery);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlayerExpense[];

      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.payee.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    const matchesDateRange = !dateRange?.from || !dateRange?.to || (
      new Date(expense.date) >= dateRange.from &&
      new Date(expense.date) <= dateRange.to
    );

    return matchesSearch && matchesCategory && matchesDateRange;
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('si-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const handleExport = () => {
    // Get only the filtered data that's currently being displayed
    const dataToExport = filteredExpenses;
    
    // Calculate total amount of filtered data
    const totalAmount = dataToExport.reduce((sum, expense) => {
      return sum + Number(expense.amount || 0);
    }, 0);

    // Format amounts with currency for CSV
    const formatAmountForCSV = (amount: number) => {
      return `LKR ${amount.toFixed(2)}`; // This will return "LKR 1000.00" format
    };
    
    // Add filter information to the CSV
    const filters: string[] = [];
    if (selectedCategory) filters.push(selectedCategory);
    if (searchQuery) filters.push('search');
    if (dateRange?.from) filters.push('dated');
    const filterSuffix = filters.length > 0 ? `-${filters.join('-')}` : '';

    // Create CSV data with formatted amounts and total
    const csv = [
      ...filters.map(filter => [`Filter Settings:`, filter]),
      ['Player Name', 'Date', 'Amount (LKR)', 'Category', 'Description', 'Payment Method', 'Status'], // Updated header
      ...dataToExport.map(expense => [
        expense.payee,
        expense.date,
        formatAmountForCSV(Number(expense.amount || 0)),
        expense.category || '',
        expense.description || '',
        expense.paymentMethod || '',
        expense.status || ''
      ]),
      [], // Empty row for spacing
      ['TOTAL', '', formatAmountForCSV(totalAmount), '', '', '', ''],
      [], // Empty row
      [`Generated on: ${new Date().toLocaleString()}`]
    ].map(row => row.join(',')).join('\n');

    // Create and trigger download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `player-expenses${filterSuffix}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleView = (expense: PlayerExpense) => {
    setSelectedExpense(expense);
  };

  const handleEdit = (expense: PlayerExpense) => {
    console.log('Edit expense:', expense);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setDateRange(undefined);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? "" : value);
  };

  const columns = [
    {
      key: "payee",
      label: "Player Name",
      sortable: true
    },
    {
      key: "date",
      label: "Date",
      sortable: true
    },
    {
      key: "amount",
      label: "Amount (LKR)",
      sortable: true,
      render: (item: PlayerExpense) => formatAmount(item.amount)
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
      key: "paymentMethod",
      label: "Payment Method",
      sortable: true
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item: PlayerExpense) => {
        const statusColors = {
          Completed: 'text-green-600',
          Pending: 'text-yellow-600',
          Cancelled: 'text-red-600'
        };
        return (
          <span className={statusColors[item.status]}>
            {item.status}
          </span>
        );
      }
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (item: PlayerExpense) => (
        <div className="flex justify-end space-x-2">
          <Button 
            onClick={() => handleView(item)}
            variant="outline"
            size="sm"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => handleSinglePrint(item)}
            variant="outline"
            size="sm"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => handleSingleExport(item)}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleSinglePrint = (expense: PlayerExpense) => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <html>
        <head>
          <title>Player Expense Details</title>
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
              max-width: 600px;
              margin: 0 auto;
            }
            .detail-row {
              display: flex;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .label {
              font-weight: bold;
              width: 150px;
            }
            .value {
              flex: 1;
            }
            .status-completed { color: #16a34a; }
            .status-pending { color: #ca8a04; }
            .status-cancelled { color: #dc2626; }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="header">
              <h1>Player Expense Details</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="detail-row">
              <div class="label">Player Name:</div>
              <div class="value">${expense.payee}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Date:</div>
              <div class="value">${expense.date}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Amount:</div>
              <div class="value">${new Intl.NumberFormat('si-LK', {
                style: 'currency',
                currency: 'LKR'
              }).format(expense.amount)}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Category:</div>
              <div class="value">${expense.category}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Payment Method:</div>
              <div class="value">${expense.paymentMethod}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Status:</div>
              <div class="value status-${expense.status.toLowerCase()}">${expense.status}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Description:</div>
              <div class="value">${expense.description}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSingleExport = (expense: PlayerExpense) => {
    const amount = parseFloat(expense.amount.toString());
    
    // Format amounts with currency for CSV
    const formatAmountForCSV = (amount: number) => {
      return `LKR ${amount.toFixed(2)}`;
    };

    const csv = [
      ['Player Name', 'Date', 'Amount (LKR)', 'Category', 'Description', 'Payment Method', 'Status'],
      [
        expense.payee,
        expense.date,
        formatAmountForCSV(amount),
        expense.category || '',
        expense.description || '',
        expense.paymentMethod || '',
        expense.status || ''
      ],
      [], // Empty row
      ['TOTAL', '', formatAmountForCSV(amount), '', '', '', '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `player-expense-${expense.id}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCloseModal = () => {
    setSelectedExpense(null);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search by player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant="outline"
                onClick={handlePrint}
                className="flex-1 md:flex-none"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button 
                variant="outline"
                onClick={handleExport}
                className="flex-1 md:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-[250px]">
              <Select
                value={selectedCategory || "all"}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-auto">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filter by date range"
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
              data={filteredExpenses}
              pageSize={10}
            />
          </div>
        )}
      </Card>

      <Dialog open={!!selectedExpense} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="font-semibold">Player Name:</div>
                <div>{selectedExpense.payee}</div>
                
                <div className="font-semibold">Date:</div>
                <div>{selectedExpense.date}</div>
                
                <div className="font-semibold">Amount:</div>
                <div>{new Intl.NumberFormat('si-LK', {
                  style: 'currency',
                  currency: 'LKR'
                }).format(selectedExpense.amount)}</div>
                
                <div className="font-semibold">Category:</div>
                <div>{selectedExpense.category}</div>
                
                <div className="font-semibold">Payment Method:</div>
                <div>{selectedExpense.paymentMethod}</div>
                
                <div className="font-semibold">Status:</div>
                <div className={`
                  ${selectedExpense.status === 'Completed' && 'text-green-600'}
                  ${selectedExpense.status === 'Pending' && 'text-yellow-600'}
                  ${selectedExpense.status === 'Cancelled' && 'text-red-600'}
                `}>
                  {selectedExpense.status}
                </div>
              </div>
              
              <div>
                <div className="font-semibold mb-2">Description:</div>
                <div className="text-sm text-gray-600">
                  {selectedExpense.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 