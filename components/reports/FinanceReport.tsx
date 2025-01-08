'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { formatLKR } from '@/lib/utils';
import { Loader2, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Category {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Transaction {
  id: string;
  amount: number;
  accountType: string;
  category?: string;  // The category field might be here
  categoryId?: string; // Or it might be here
  createdAt: string;
  date: string;
  description: string;
  payee?: string;
  payeeType?: string;
  paymentMethod: string;
  receiptIssued: boolean;
  receiptNo?: string;
  status: string;
  type: string;
}

interface TransactionWithCategory extends Transaction {
  categoryName: string;
  category?: string;
  categoryId?: string;
}

interface FinanceReportProps {
  type: 'income' | 'expense' | 'player-finance';
  title: string;
}

export default function FinanceReport({ type, title }: FinanceReportProps) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<TransactionWithCategory[]>([]);
  const [filteredData, setFilteredData] = useState<TransactionWithCategory[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [playerFilter, setPlayerFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && user) {
      const loadData = async () => {
        await fetchCategories();
        await fetchData();
      };
      loadData();
    }
  }, [type, user, authLoading]);

  useEffect(() => {
    filterData();
  }, [data, startDate, endDate, playerFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const fetchedCategories = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          type: data.type || '',
          status: data.status || 'Inactive'
        } as Category;
      });
      
      console.log('Fetched categories:', fetchedCategories);
      
      // Add 'all' option and all categories
      setCategories([
        { id: 'all', name: 'All', type: '', status: 'Active' },
        ...fetchedCategories
      ]);

      return fetchedCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First fetch categories
      const categoriesRef = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const fetchedCategories = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          type: data.type || '',
          status: data.status || 'Inactive'
        } as Category;
      });
      
      console.log('Available categories:', fetchedCategories);
      
      // Add 'all' option and all categories
      setCategories([
        { id: 'all', name: 'All', type: '', status: 'Active' },
        ...fetchedCategories
      ]);
      
      const transactionsRef = collection(db, 'transactions');
      let transactionQuery;

      if (type === 'income') {
        transactionQuery = query(transactionsRef, where('type', '==', 'Income'));
      } else if (type === 'expense') {
        transactionQuery = query(transactionsRef, where('type', '==', 'Expense'));
      } else {
        // For general finance report, get all completed transactions
        transactionQuery = query(
          transactionsRef, 
          where('status', '==', 'Completed')
        );
      }
      
      const querySnapshot = await getDocs(transactionQuery);
      
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data() as Transaction;
        
        let categoryName;
        // For all finance reports
        if (data.category) {
          const category = fetchedCategories.find(c => c.id === data.category);
          categoryName = category?.name || 'Unknown Category';
        } else {
          categoryName = data.accountType || 'Unknown Category';
        }
        
        console.log('Processing transaction:', {
          transactionId: doc.id,
          type: data.type,
          accountType: data.accountType,
          category: data.category,
          assignedCategory: categoryName,
          payeeType: data.payeeType
        });
        
        const transaction: TransactionWithCategory = {
          id: doc.id,
          amount: data.amount,
          accountType: data.accountType,
          category: data.category,
          createdAt: data.createdAt,
          date: data.date,
          description: data.description || '',
          payee: data.payee,
          payeeType: data.payeeType,
          paymentMethod: data.paymentMethod,
          receiptIssued: data.receiptIssued,
          receiptNo: data.receiptNo,
          status: data.status,
          type: data.type,
          categoryName
        };
        
        return transaction;
      });

      // Filter only completed transactions
      const filteredTransactions = transactions.filter(t => t.status === 'Completed');

      // Sort by date (newest first)
      filteredTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setData(filteredTransactions);
      setFilteredData(filteredTransactions);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...data];

    if (startDate) {
      filtered = filtered.filter(item => new Date(item.date) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(item => new Date(item.date) <= endDate);
    }

    if (playerFilter) {
      filtered = filtered.filter(item => 
        item.payee?.toLowerCase().includes(playerFilter.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(item => {
        // For all report types, check category fields
        return (
          item.category === categoryFilter || 
          item.categoryId === categoryFilter ||
          item.categoryName === categoryFilter
        );
      });
    }

    setFilteredData(filtered);
  };

  // Format date to display in DD/MM/YYYY format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const exportToExcel = () => {
    // Prepare the data for export
    const exportData = filteredData.map(item => ({
      Date: formatDate(item.date),
      Type: item.type,
      Category: item.categoryName,
      Description: item.description,
      'Player Name': item.payee || '-',
      'Payment Method': item.paymentMethod,
      Amount: item.amount,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Finance Report');

    // Generate file name with current date
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Please log in to view reports.</p>
        <Button
          className="mt-4"
          onClick={() => window.location.href = '/auth/login'}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button 
          onClick={exportToExcel}
          className="flex items-center gap-2"
          disabled={loading || filteredData.length === 0}
        >
          <FileDown className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>
      
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Income</div>
          <div className="text-2xl font-bold text-green-600">
            {formatLKR(filteredData.reduce((sum, item) => 
              item.type === 'Income' ? sum + item.amount : sum, 0
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {formatLKR(filteredData.reduce((sum, item) => 
              item.type === 'Expense' ? sum + item.amount : sum, 0
            ))}
          </div>
        </Card>
      </div>
      
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {categories
                  .filter(cat => cat.status === 'Active')
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Player Name</label>
            <Input
              placeholder="Search by player name"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Player Name</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-red-500">Error loading data</TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No data found</TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>
                    <span className={item.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.payee || '-'}</TableCell>
                  <TableCell>{item.paymentMethod}</TableCell>
                  <TableCell className="text-right">
                    <span className={item.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                      {formatLKR(item.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 