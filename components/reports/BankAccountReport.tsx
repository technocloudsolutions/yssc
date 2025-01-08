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
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { formatLKR } from '@/lib/utils';
import { Loader2, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AccountType {
  id: string;
  name: string;
  type: string;
  status: string;
  balance: number;
  description?: string;
  transactions?: any[];
}

interface Transaction {
  id: string;
  date: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  description: string;
  category?: string;
  paymentMethod: string;
  bankAccount?: string;
  accountType?: string;
  receiptNo?: string;
  status: string;
}

interface TransactionWithDetails extends Transaction {
  bankAccountName: string;
  bankAccountNumber: string;
}

export default function BankAccountReport() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TransactionWithDetails[]>([]);
  const [filteredData, setFilteredData] = useState<TransactionWithDetails[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [accountFilter, setAccountFilter] = useState('all');
  const [bankAccounts, setBankAccounts] = useState<AccountType[]>([]);

  useEffect(() => {
    const fetchBankData = async () => {
      try {
        setLoading(true);
        
        // Fetch all account types that are bank-related
        const accountTypesRef = collection(db, 'accountTypes');
        const accountTypesQuery = query(
          accountTypesRef,
          where('type', 'in', ['Expense', 'Income', 'Bank'])  // Include all relevant account types
        );
        const accountTypesSnapshot = await getDocs(accountTypesQuery);
        const accounts = accountTypesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            type: data.type || '',
            status: data.status || 'Active',
            balance: parseFloat(data.balance) || 0,
            description: data.description || '',
            transactions: Array.isArray(data.transactions) ? data.transactions : []
          } as AccountType;
        });

        console.log('Raw account data:', accounts);

        if (accounts.length === 0) {
          setError('No bank accounts found. Please check account types configuration.');
          setLoading(false);
          return;
        }

        // Process transactions from the accounts data
        const allTransactions: TransactionWithDetails[] = [];
        
        accounts.forEach(account => {
          if (Array.isArray(account.transactions)) {
            const accountTransactions = account.transactions.map(transaction => ({
              id: transaction.id || '',
              date: transaction.date || '',
              type: transaction.type || 'debit',
              amount: parseFloat(transaction.amount) || 0,
              description: transaction.description || '',
              category: transaction.category || '',
              paymentMethod: transaction.paymentMethod || 'Bank Transfer',
              bankAccount: transaction.bankAccount || account.id,
              accountType: account.type,
              receiptNo: transaction.receiptNumber || transaction.id || '',
              status: transaction.status || 'Completed',
              bankAccountName: account.name,
              bankAccountNumber: account.id
            } as TransactionWithDetails));
            
            allTransactions.push(...accountTransactions);
          }
        });

        // Sort transactions by date
        const sortedTransactions = allTransactions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        console.log('Found bank accounts:', accounts);
        console.log('Found transactions:', sortedTransactions.length);
        
        setBankAccounts(accounts);
        setData(sortedTransactions);
        setFilteredData(sortedTransactions);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load account data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBankData();
    }
  }, [user]);

  useEffect(() => {
    if (data.length > 0) {
      filterData();
    }
  }, [data, startDate, endDate, accountFilter]);

  const filterData = () => {
    let filtered = [...data];

    if (startDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        return itemDate >= startOfDay;
      });
    }

    if (endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return itemDate <= endOfDay;
      });
    }

    if (accountFilter && accountFilter !== 'all') {
      filtered = filtered.filter(item => {
        const account = bankAccounts.find(acc => acc.id === accountFilter);
        return item.bankAccountName === account?.name;
      });
    }

    console.log('Filtered transactions:', {
      total: data.length,
      filtered: filtered.length,
      dateRange: { startDate, endDate },
      accountFilter
    });

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
      'Bank Account': item.bankAccountName,
      'Account Number': item.bankAccountNumber,
      Type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      Description: item.description,
      'Reference No': item.receiptNo || '-',
      Amount: item.amount,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Account Report');

    const fileName = `Bank_Account_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Bank Account Report</h1>
          <p className="text-sm text-gray-500">View account balances and transactions</p>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-4">
          <h3 className="text-sm text-gray-500">Total Balance</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatLKR(bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-gray-500">Total Credits</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatLKR(filteredData
              .filter(t => t.type === 'credit')
              .reduce((sum, t) => sum + t.amount, 0)
            )}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-gray-500">Total Debits</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatLKR(filteredData
              .filter(t => t.type === 'debit')
              .reduce((sum, t) => sum + t.amount, 0)
            )}
          </p>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium mb-2">Account</label>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Accounts and Transactions */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading data...</span>
        </div>
      ) : bankAccounts.length === 0 ? (
        <Card className="p-4 text-center text-gray-500">
          No accounts found
        </Card>
      ) : (
        <div className="space-y-8">
          {bankAccounts
            .filter(account => accountFilter === 'all' || account.id === accountFilter)
            .map(account => {
              const accountTransactions = filteredData.filter(t => t.bankAccountName === account.name);
              return (
                <Card key={account.id} className="p-6">
                  {/* Account Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold">{account.name}</h3>
                      <p className="text-sm text-gray-500">{account.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Current Balance</p>
                      <p className="text-xl font-bold text-primary">{formatLKR(account.balance)}</p>
                    </div>
                  </div>

                  {/* Account Transactions */}
                  {accountTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No transactions found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountTransactions.map(transaction => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{transaction.receiptNo || '-'}</TableCell>
                            <TableCell>
                              <span className={
                                transaction.type === 'credit' ? 'text-green-600' :
                                transaction.type === 'debit' ? 'text-red-600' :
                                'text-blue-600'
                              }>
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={
                                transaction.type === 'credit' ? 'text-green-600' :
                                transaction.type === 'debit' ? 'text-red-600' :
                                'text-blue-600'
                              }>
                                {formatLKR(transaction.amount)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
} 