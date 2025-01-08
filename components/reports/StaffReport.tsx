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
import { collection, query, getDocs, where } from 'firebase/firestore';
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
  category?: string;
  categoryId?: string;
  createdAt: string;
  date: string;
  description: string;
  payee?: string;
  payeeType?: string;
  receivedFrom?: string;
  receivedFromType?: string;
  paymentMethod: string;
  receiptIssued: boolean;
  receiptNo?: string;
  status: string;
  type: string;
}

interface TransactionWithCategory extends Transaction {
  categoryName: string;
}

export default function StaffReport() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<TransactionWithCategory[]>([]);
  const [filteredData, setFilteredData] = useState<TransactionWithCategory[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [staffFilter, setStaffFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      const loadData = async () => {
        await fetchCategories();
        await fetchData();
      };
      loadData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchData();
    }
  }, [categories]);

  useEffect(() => {
    filterData();
  }, [data, startDate, endDate, staffFilter, categoryFilter]);

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
      
      setCategories([
        { id: 'all', name: 'All', type: '', status: 'Active' },
        ...fetchedCategories
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const transactionsRef = collection(db, 'transactions');
      
      // Query for expense transactions (where staff is payee)
      const expenseQuery = query(
        transactionsRef,
        where('payeeType', '==', 'Staff'),
        where('status', '==', 'Completed')
      );
      
      // Query for income transactions (where staff is receiver)
      const incomeQuery = query(
        transactionsRef,
        where('receivedFromType', '==', 'Staff'),
        where('status', '==', 'Completed')
      );
      
      // Get both expense and income transactions
      const [expenseSnapshot, incomeSnapshot] = await Promise.all([
        getDocs(expenseQuery),
        getDocs(incomeQuery)
      ]);
      
      // Combine and process all transactions
      const allTransactions = [...expenseSnapshot.docs, ...incomeSnapshot.docs].map(doc => {
        const data = doc.data() as Transaction;
        
        let categoryName;
        if (data.category) {
          const category = categories.find(c => c.id === data.category);
          categoryName = category?.name || 'Unknown Category';
        } else {
          categoryName = data.accountType || 'Unknown Category';
        }
        
        // Get the staff name from either payee or receivedFrom
        const staffName = data.payee || data.receivedFrom || '-';
        
        console.log('Processing staff transaction:', {
          id: doc.id,
          type: data.type,
          payeeType: data.payeeType,
          receivedFromType: data.receivedFromType,
          staffName,
          category: categoryName
        });
        
        return {
          ...data,
          id: doc.id,
          categoryName,
          payee: staffName // Ensure we always have the staff name in payee field
        } as TransactionWithCategory;
      });

      // Sort by date (newest first)
      allTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      console.log('Total staff transactions found:', allTransactions.length);
      
      setData(allTransactions);
      setFilteredData(allTransactions);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
    } finally {
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

    if (staffFilter) {
      filtered = filtered.filter(item => 
        item.payee?.toLowerCase().includes(staffFilter.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(item => {
        return (
          item.category === categoryFilter || 
          item.categoryId === categoryFilter ||
          item.categoryName === categoryFilter
        );
      });
    }

    setFilteredData(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      Date: formatDate(item.date),
      Type: item.type,
      Category: item.categoryName,
      Description: item.description,
      'Staff Name': item.payee || '-',
      'Payment Method': item.paymentMethod,
      Amount: item.amount,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Report');

    const fileName = `Staff_Finance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        <h1 className="text-2xl font-bold">Staff Finance Report</h1>
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
            <label className="block text-sm font-medium mb-2">Staff Name</label>
            <Input
              placeholder="Search by staff name"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
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
              <TableHead>Staff Name</TableHead>
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