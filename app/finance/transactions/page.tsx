'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatLKR } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { FinanceTransactionForm } from '@/components/forms/finance-transaction-form';
import type { FinanceTransactionFormData } from '@/components/forms/finance-transaction-form';
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
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt?: string;
  bankAccount?: string;
}

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (transaction: Transaction) => React.ReactNode;
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const snapshot = await getDocs(transactionsRef);
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(transactionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Get transactions sorted by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'Income' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'Expense' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Define columns for the data table
  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true as const,
      render: (transaction: Transaction) => new Date(transaction.date).toLocaleDateString()
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true as const
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true as const
    },
    { 
      key: 'amount', 
      label: 'Amount',
      sortable: true as const,
      render: (transaction: Transaction) => (
        <span className={transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
          {formatLKR(transaction.amount)}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      sortable: true as const
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true as const
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true as const
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false as const,
      render: (transaction: Transaction) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingTransaction(transaction);
              setIsTransactionModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-500"
            onClick={() => handleDelete(transaction.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const handleSubmit = async (data: FinanceTransactionFormData) => {
    try {
      const transactionData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingTransaction) {
        // Update existing transaction
        const transactionRef = doc(db, 'transactions', editingTransaction.id);
        await updateDoc(transactionRef, transactionData);
      } else {
        // Create new transaction
        const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
      }

      // Refresh transactions
      fetchTransactions();
      
      // Close modal and show success message
      setIsTransactionModalOpen(false);
      setEditingTransaction(null);
      toast({
        title: "Success",
        description: editingTransaction ? "Transaction updated successfully" : "Transaction added successfully"
      });
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save transaction",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        fetchTransactions();
        toast({
          title: "Success",
          description: "Transaction deleted successfully"
        });
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Finance Management</h1>
        <Button onClick={() => setIsTransactionModalOpen(true)}>
          Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Total Income</h3>
          <p className="text-2xl text-green-600">{formatLKR(totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Total Expenses</h3>
          <p className="text-2xl text-red-600">{formatLKR(totalExpenses)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Balance</h3>
          <p className={`text-2xl ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatLKR(balance)}
          </p>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={sortedTransactions}
        onEdit={(transaction) => {
          setEditingTransaction(transaction as Transaction);
          setIsTransactionModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      >
        <FinanceTransactionForm
          onSubmit={handleSubmit}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
} 