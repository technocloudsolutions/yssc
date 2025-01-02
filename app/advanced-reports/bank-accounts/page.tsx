'use client';

import { useState, useEffect } from "react";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { addDays, format } from "date-fns";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { useReportContext } from "@/contexts/ReportContext";

interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'credit';
  description: string;
  transferFromAccount?: string;
  accountName?: string;
}

interface BankAccount {
  id: string;
  name: string;
  description: string;
  balance: number;
  status: 'Active';
  type: 'Income' | 'Expense';
  createdAt: string;
  transactions: BankTransaction[];
}

interface MetricCardProps {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

const MetricCard = ({ label, value, change, trend }: MetricCardProps) => (
  <Card className="p-6">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {formatCurrency(value)}
        </span>
        {trend !== 'neutral' && (
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  </Card>
);

const formatCurrency = (amount: number) => {
  return `LKR ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function BankAccountsReportPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { dateRange, setExportHandler } = useReportContext();

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        if (!user || authLoading) {
          return;
        }

        // Fetch bank accounts from accountTypes collection
        const accountsRef = collection(db, 'accountTypes');
        const accountsSnapshot = await getDocs(accountsRef);
        
        if (accountsSnapshot.empty) {
          console.log('No bank accounts found');
          setBankAccounts([]);
          return;
        }

        const accounts = accountsSnapshot.docs.map(doc => {
          const data = doc.data();
          const transactions = Array.isArray(data.transactions) ? data.transactions : [];
          
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            balance: data.balance || 0,
            status: data.status || 'Active',
            type: data.type || 'Expense',
            createdAt: data.createdAt || new Date().toISOString(),
            transactions: transactions.map((tx: any) => ({
              id: tx.id || '',
              date: tx.date || new Date().toISOString(),
              amount: tx.amount || 0,
              type: tx.type || 'credit',
              description: tx.description || '',
              transferFromAccount: tx.transferFromAccount || ''
            }))
          } as BankAccount;
        });

        setBankAccounts(accounts);
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch bank accounts data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccounts();
  }, [user, authLoading, toast]);

  const calculateMetrics = () => {
    const incomeAccounts = bankAccounts.filter(account => account.type === 'Income');
    const expenseAccounts = bankAccounts.filter(account => account.type === 'Expense');
    
    const totalIncome = incomeAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalBalance = totalIncome - totalExpenses;
    
    const totalAccounts = bankAccounts.length;
    const activeAccounts = bankAccounts.length;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentTransactions = bankAccounts.flatMap(account => 
      account.transactions
        .filter(tx => new Date(tx.date) >= thirtyDaysAgo)
        .map(tx => ({
          ...tx,
          accountType: account.type,
          accountName: account.name
        }))
    );

    const recentIncome = recentTransactions
      .filter(tx => tx.accountType === 'Income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const recentExpenses = recentTransactions
      .filter(tx => tx.accountType === 'Expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const netFlow = recentIncome - recentExpenses;

    return [
      {
        label: 'Total Balance',
        value: totalBalance,
        change: netFlow !== 0 ? (netFlow / Math.abs(totalBalance) * 100) : 0,
        trend: netFlow > 0 ? 'up' as const : netFlow < 0 ? 'down' as const : 'neutral' as const
      },
      {
        label: 'Total Income',
        value: totalIncome,
        change: recentIncome > 0 ? (recentIncome / totalIncome * 100) : 0,
        trend: recentIncome > 0 ? 'up' as const : 'neutral' as const
      },
      {
        label: 'Total Expenses',
        value: totalExpenses,
        change: recentExpenses > 0 ? (recentExpenses / totalExpenses * 100) : 0,
        trend: recentExpenses > 0 ? 'down' as const : 'neutral' as const
      },
      {
        label: '30-Day Net Flow',
        value: netFlow,
        change: netFlow !== 0 ? 100 : 0,
        trend: netFlow > 0 ? 'up' as const : netFlow < 0 ? 'down' as const : 'neutral' as const
      }
    ] as const;
  };

  const getFilteredTransactions = () => {
    return bankAccounts
      .flatMap(account =>
        account.transactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return (!dateRange.from || txDate >= dateRange.from) &&
                   (!dateRange.to || txDate <= dateRange.to);
          })
          .map(tx => ({
            ...tx,
            accountName: account.name,
            accountType: account.type
          }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Register export handler
  useEffect(() => {
    const handleExportExcel = () => {
      try {
        const filteredTransactions = getFilteredTransactions();
        const data = filteredTransactions.map(tx => ({
          Date: format(new Date(tx.date), 'yyyy-MM-dd'),
          Description: tx.description,
          Account: tx.accountName,
          Type: tx.accountType,
          Amount: tx.amount,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
        
        // Generate file name with date range
        const fromDate = format(dateRange.from || addDays(new Date(), -30), 'yyyy-MM-dd');
        const toDate = format(dateRange.to || new Date(), 'yyyy-MM-dd');
        const fileName = `bank_transactions_${fromDate}_to_${toDate}.xlsx`;
        
        XLSX.writeFile(wb, fileName);

        toast({
          title: "Success",
          description: "Report exported successfully",
        });
      } catch (error) {
        console.error('Error exporting data:', error);
        toast({
          title: "Error",
          description: "Failed to export report. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Register the handler with the context
    if (!loading && bankAccounts.length > 0) {
      setExportHandler(() => handleExportExcel);
    }

    // Cleanup
    return () => {
      setExportHandler(() => {});
    };
  }, [loading, bankAccounts, dateRange, setExportHandler, toast]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bank Accounts Report</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
            {calculateMetrics().map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          <Card className="p-6 print:shadow-none">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Bank Accounts Overview</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Transaction</TableHead>
                  <TableHead className="print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => {
                  const lastTransaction = account.transactions[0];
                  return (
                    <TableRow key={account.id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          account.type === 'Income' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        } print:bg-transparent print:border print:border-current`}>
                          {account.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={account.type === 'Income' ? "text-blue-600" : "text-amber-600"}>
                          {formatCurrency(account.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 print:bg-transparent print:border print:border-current">
                          {account.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lastTransaction ? (
                          <div className="flex flex-col">
                            <span>{formatDate(lastTransaction.date)}</span>
                            <span className="text-sm text-muted-foreground">
                              {lastTransaction.description}
                            </span>
                          </div>
                        ) : (
                          "No transactions"
                        )}
                      </TableCell>
                      <TableCell className="print:hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle view transactions
                          }}
                        >
                          View Transactions
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6 print:shadow-none">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Transaction History</h2>
                <p className="text-sm text-muted-foreground">
                  View all transactions across all bank accounts
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Showing transactions from {
                  format(dateRange?.from || addDays(new Date(), -30), 'MMM d, yyyy')
                } to {
                  format(dateRange?.to || new Date(), 'MMM d, yyyy')
                }
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredTransactions().map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{transaction.accountName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                          transaction.accountType === 'Income' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        } print:bg-transparent print:border print:border-current`}>
                          {transaction.accountType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 print:bg-transparent print:border print:border-current">
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={transaction.accountType === 'Income' ? "text-blue-600" : "text-amber-600"}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
} 