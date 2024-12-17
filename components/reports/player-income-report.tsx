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

interface PlayerIncome {
  id: string;
  receivedFrom: string;
  receivedFromType: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  paymentMethod: string;
  type: 'Income' | 'Expense';
}

export function PlayerIncomeReport() {
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<PlayerIncome[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncome, setSelectedIncome] = useState<PlayerIncome | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchIncomes();
  }, []);

  useEffect(() => {
    if (incomes.length > 0) {
      const uniqueCategories = [...new Set(incomes.map(income => income.category))];
      setCategories(uniqueCategories);
    }
  }, [incomes]);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const incomesRef = collection(db, 'transactions');
      const incomesQuery = query(
        incomesRef,
        where('type', '==', 'Income'),
        where('receivedFromType', '==', 'Player')
      );
      
      const querySnapshot = await getDocs(incomesQuery);
      const incomesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlayerIncome[];

      setIncomes(incomesData);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.receivedFrom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || income.category === selectedCategory;
    const matchesDateRange = !dateRange?.from || !dateRange?.to || (
      new Date(income.date) >= dateRange.from &&
      new Date(income.date) <= dateRange.to
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
    const dataToExport = filteredIncomes;
    
    const totalAmount = dataToExport.reduce((sum, income) => {
      return sum + Number(income.amount || 0);
    }, 0);

    const formatAmountForCSV = (amount: number) => {
      return `LKR ${amount.toFixed(2)}`;
    };
    
    const filters: string[] = [];
    if (selectedCategory) filters.push(selectedCategory);
    if (searchQuery) filters.push('search');
    if (dateRange?.from) filters.push('dated');
    const filterSuffix = filters.length > 0 ? `-${filters.join('-')}` : '';

    const csv = [
      ...filters.map(filter => [`Filter Settings:`, filter]),
      ['Player Name', 'Date', 'Amount (LKR)', 'Category', 'Description', 'Payment Method', 'Status'],
      ...dataToExport.map(income => [
        income.receivedFrom,
        income.date,
        formatAmountForCSV(Number(income.amount || 0)),
        income.category || '',
        income.description || '',
        income.paymentMethod || '',
        income.status || ''
      ]),
      [],
      ['TOTAL', '', formatAmountForCSV(totalAmount), '', '', '', ''],
      [],
      [`Generated on: ${new Date().toLocaleString()}`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `player-income${filterSuffix}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleView = (income: PlayerIncome) => {
    setSelectedIncome(income);
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
      key: "receivedFrom",
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
      render: (item: PlayerIncome) => formatAmount(item.amount)
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
      render: (item: PlayerIncome) => {
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
      render: (item: PlayerIncome) => (
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

  const handleSinglePrint = (income: PlayerIncome) => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <html>
        <head>
          <title>Player Income Details</title>
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
              <h1>Player Income Details</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="detail-row">
              <div class="label">Player Name:</div>
              <div class="value">${income.receivedFrom}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Date:</div>
              <div class="value">${income.date}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Amount:</div>
              <div class="value">${new Intl.NumberFormat('si-LK', {
                style: 'currency',
                currency: 'LKR'
              }).format(income.amount)}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Category:</div>
              <div class="value">${income.category}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Payment Method:</div>
              <div class="value">${income.paymentMethod}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Status:</div>
              <div class="value status-${income.status.toLowerCase()}">${income.status}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Description:</div>
              <div class="value">${income.description}</div>
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

  const handleSingleExport = (income: PlayerIncome) => {
    const amount = parseFloat(income.amount.toString());
    
    const formatAmountForCSV = (amount: number) => {
      return `LKR ${amount.toFixed(2)}`;
    };

    const csv = [
      ['Player Name', 'Date', 'Amount (LKR)', 'Category', 'Description', 'Payment Method', 'Status'],
      [
        income.receivedFrom,
        income.date,
        formatAmountForCSV(amount),
        income.category || '',
        income.description || '',
        income.paymentMethod || '',
        income.status || ''
      ],
      [],
      ['TOTAL', '', formatAmountForCSV(amount), '', '', '', '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `player-income-${income.id}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCloseModal = () => {
    setSelectedIncome(null);
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
              data={filteredIncomes}
              pageSize={10}
            />
          </div>
        )}
      </Card>

      <Dialog open={!!selectedIncome} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Income Details</DialogTitle>
          </DialogHeader>
          {selectedIncome && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="font-semibold">Player Name:</div>
                <div>{selectedIncome.receivedFrom}</div>
                
                <div className="font-semibold">Date:</div>
                <div>{selectedIncome.date}</div>
                
                <div className="font-semibold">Amount:</div>
                <div>{new Intl.NumberFormat('si-LK', {
                  style: 'currency',
                  currency: 'LKR'
                }).format(selectedIncome.amount)}</div>
                
                <div className="font-semibold">Category:</div>
                <div>{selectedIncome.category}</div>
                
                <div className="font-semibold">Payment Method:</div>
                <div>{selectedIncome.paymentMethod}</div>
                
                <div className="font-semibold">Status:</div>
                <div className={`
                  ${selectedIncome.status === 'Completed' && 'text-green-600'}
                  ${selectedIncome.status === 'Pending' && 'text-yellow-600'}
                  ${selectedIncome.status === 'Cancelled' && 'text-red-600'}
                `}>
                  {selectedIncome.status}
                </div>
              </div>
              
              <div>
                <div className="font-semibold mb-2">Description:</div>
                <div className="text-sm text-gray-600">
                  {selectedIncome.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 