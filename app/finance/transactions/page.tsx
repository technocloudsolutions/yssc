'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatLKR } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { TransactionForm } from '@/components/forms/transaction-form';
import { handleTransaction } from '@/lib/transactions';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

interface AccountType {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  balance?: number;
  transactions?: Transaction[];
}

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description: string;
  date: string;
  transferToAccount?: string;
  transferFromAccount?: string;
  accountName?: string;
  accountId?: string;
  transferToAccountName?: string;
  transferFromAccountName?: string;
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsRef = collection(db, 'accountTypes');
      const snapshot = await getDocs(accountsRef);
      
      const allAccounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccountType[];
      
      // Filter accounts to only show those with status 'Active'
      const activeAccounts = allAccounts.filter(account => account.status === 'Active');
      setAccounts(activeAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Sort accounts alphabetically
  const sortedAccounts = [...accounts].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Get all transactions from all accounts and add account details
  const allTransactions = accounts.flatMap(account => 
    (account.transactions || []).map(transaction => ({
      ...transaction,
      accountName: account.name,
      accountId: account.id,
      // Add transfer account name for better display
      transferToAccountName: transaction.transferToAccount 
        ? accounts.find(a => a.id === transaction.transferToAccount)?.name 
        : undefined,
      transferFromAccountName: transaction.transferFromAccount
        ? accounts.find(a => a.id === transaction.transferFromAccount)?.name
        : undefined
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const columns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (transaction: Transaction) => new Date(transaction.date).toLocaleDateString()
    },
    {
      key: "accountName",
      label: "Account",
      sortable: true,
      render: (transaction: Transaction) => {
        if (transaction.type === 'transfer') {
          return transaction.transferToAccountName 
            ? `${transaction.accountName} → ${transaction.transferToAccountName}`
            : transaction.accountName;
        }
        return transaction.accountName;
      }
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (transaction: Transaction) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          transaction.type === 'credit' 
            ? 'bg-green-100 text-green-800'
            : transaction.type === 'debit'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
        </span>
      )
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (transaction: Transaction) => formatLKR(transaction.amount)
    },
    {
      key: "description",
      label: "Description",
      sortable: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Manage your financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          <Button 
            onClick={() => {
              setIsTransactionModalOpen(true);
              if (accounts.length > 0) {
                setSelectedAccount(accounts[0]);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Money
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Credits</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatLKR(allTransactions.reduce((sum, t) => 
              t.type === 'credit' ? sum + t.amount : sum, 0
            ))}
          </p>
        </Card>
        <Card className="p-4 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Debits</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatLKR(allTransactions.reduce((sum, t) => 
              t.type === 'debit' ? sum + t.amount : sum, 0
            ))}
          </p>
        </Card>
        <Card className="p-4 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Transfers</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatLKR(allTransactions.reduce((sum, t) => 
              t.type === 'transfer' ? sum + t.amount : sum, 0
            ))}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <DataTable
          columns={columns}
          data={allTransactions}
        />
      </Card>

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setSelectedAccount(null);
        }}
        title="Add New Transaction"
      >
        {accounts.length > 0 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="account">Select Account</Label>
              <select
                id="account"
                className="w-full p-2 border rounded"
                value={selectedAccount?.id || ''}
                onChange={(e) => {
                  const account = accounts.find(a => a.id === e.target.value);
                  setSelectedAccount(account || null);
                }}
                required
              >
                <option value="">Select Account</option>
                {sortedAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatLKR(account.balance || 0)})
                  </option>
                ))}
              </select>
            </div>

            {selectedAccount && (
              <TransactionForm
                onSubmit={async (data) => {
                  try {
                    await handleTransaction(selectedAccount.id, data, () => {
                      setIsTransactionModalOpen(false);
                      setSelectedAccount(null);
                      fetchAccounts();
                    }, (error) => {
                      toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                      });
                    });
                  } catch (error) {
                    console.error('Error handling transaction:', error);
                  }
                }}
                onClose={() => {
                  setIsTransactionModalOpen(false);
                  setSelectedAccount(null);
                }}
                accounts={accounts}
                selectedAccountId={selectedAccount.id}
              />
            )}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Please create an account first in the Settings page.
            </p>
            <Button 
              onClick={() => setIsTransactionModalOpen(false)} 
              variant="outline"
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
} 