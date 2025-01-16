'use client';

import { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Building2, PlusCircle, ArrowRightLeft, Edit, Trash2, ClipboardList, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AccountTypeForm } from '@/components/forms/account-type-form';
import { formatLKR } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { TransactionForm } from '@/components/forms/transaction-form';
import { handleTransaction } from '@/lib/transactions';
import type { Transaction, TransactionFormData } from '@/lib/transactions';
import { CSVLink } from 'react-csv';

interface AccountType {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  balance?: number;
  transactions?: Transaction[];
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    branchName: string;
    swiftCode?: string;
  };
}

export default function BankAccountsPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountType | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null);
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountTypesRef = collection(db, 'accountTypes');
      const snapshot = await getDocs(accountTypesRef);
      
      const allAccounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccountType[];
      
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openTransactionModal = (account: AccountType, type: 'credit' | 'debit' | 'transfer' = 'credit') => {
    setSelectedAccount(account);
    setIsTransactionModalOpen(true);
  };

  const filteredAccounts = accounts.filter(account => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      account.name?.toLowerCase().includes(searchLower) ||
      account.description?.toLowerCase().includes(searchLower)
    );
  });

  const columns: Column[] = [
    {
      key: "name",
      label: "Account Name",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      render: (account: AccountType) => formatLKR(account.balance || 0)
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (account: AccountType) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          account.status === 'Active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {account.status}
        </span>
      )
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (account: AccountType) => (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              className="bg-green-50 hover:bg-green-100 border-green-200 h-8 px-2 py-1"
              onClick={() => openTransactionModal(account, 'credit')}
            >
              <PlusCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 h-8 px-2 py-1"
              onClick={() => openTransactionModal(account, 'transfer')}
            >
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-purple-50 hover:bg-purple-100 border-purple-200 h-8 px-2 py-1"
              onClick={() => {
                setSelectedAccount(account);
                setIsTransactionDetailsOpen(true);
              }}
            >
              <ClipboardList className="h-4 w-4 text-purple-600" />
            </Button>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-gray-100 h-8 px-2 py-1"
              onClick={() => handleEdit(account)}
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-red-100 h-8 px-2 py-1"
              onClick={() => handleDelete(account.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      )
    }
  ];

  const handleSubmit = async (data: any) => {
    try {
      const accountTypesRef = collection(db, 'accountTypes');
      
      if (editingAccount) {
        const docRef = doc(db, 'accountTypes', editingAccount.id);
        const currentDoc = await getDoc(docRef);
        const currentData = currentDoc.data();
        const currentBalance = currentData?.balance || 0;
        
        // If balance has changed, add a transaction
        if (data.balance !== currentBalance) {
          const difference = data.balance - currentBalance;
          const transaction = {
            id: Date.now().toString(),
            amount: Math.abs(difference),
            type: difference > 0 ? 'credit' : 'debit',
            description: 'Balance adjustment',
            date: new Date().toISOString()
          };
          
          await updateDoc(docRef, {
            name: data.name,
            type: data.type || 'Income',
            description: data.description || '',
            status: data.status || 'Active',
            balance: data.balance,
            transactions: [...(currentData?.transactions || []), transaction]
          });
        } else {
          // No balance change, just update other fields
          await updateDoc(docRef, {
            name: data.name,
            type: data.type || 'Income',
            description: data.description || '',
            status: data.status || 'Active'
          });
        }
      } else {
        // Creating new account
        const accountData = {
          name: data.name,
          type: data.type || 'Income',
          description: data.description || '',
          status: data.status || 'Active',
          createdAt: new Date().toISOString(),
          balance: data.balance || 0,
          transactions: data.balance ? [{
            id: Date.now().toString(),
            amount: data.balance,
            type: 'credit',
            description: 'Initial balance',
            date: new Date().toISOString()
          }] : []
        };
        await addDoc(accountTypesRef, accountData);
      }

      setIsModalOpen(false);
      setEditingAccount(null);
      fetchAccounts();
      toast({
        title: editingAccount ? "Account Updated" : "Account Created",
        description: editingAccount 
          ? `Successfully updated ${data.name}`
          : `Successfully created ${data.name} with initial balance of ${formatLKR(data.balance || 0)}`,
      });
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: "There was an error saving the account.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (account: AccountType) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        const docRef = doc(db, 'accountTypes', id);
        await deleteDoc(docRef);
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('transaction-details-print');
    if (printContent) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Transaction Details - ${selectedAccount?.name}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .transaction { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
                .credit { color: green; }
                .debit { color: red; }
                .transfer { color: blue; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const prepareCSVData = (transactions: Transaction[]) => {
    return transactions.map(t => ({
      Date: new Date(t.date).toLocaleString(),
      Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      Amount: t.amount,
      Description: t.description,
      'Transfer Details': t.transferToAccount 
        ? `To: ${accounts.find(a => a.id === t.transferToAccount)?.name}`
        : t.transferFromAccount 
        ? `From: ${accounts.find(a => a.id === t.transferFromAccount)?.name}`
        : ''
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Account Types</h1>
            <p className="text-sm text-muted-foreground">Manage your account types and balances</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Account Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatLKR(totalBalance)}
          </p>
        </Card>
        <Card className="p-4 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Active Accounts</h3>
          <p className="text-2xl font-bold text-blue-600">
            {accounts.filter(account => account.status === 'Active').length}
          </p>
        </Card>
        <Card className="p-4 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Inactive Accounts</h3>
          <p className="text-2xl font-bold text-red-600">
            {accounts.filter(account => account.status === 'Inactive').length}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredAccounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(null);
        }}
        title={editingAccount ? 'Edit Account Type' : 'Add New Account Type'}
      >
        <AccountTypeForm
          onSubmit={handleSubmit}
          initialData={editingAccount || {
            type: 'Income',
            status: 'Active'
          }}
        />
      </Modal>

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setSelectedAccount(null);
        }}
        title={selectedAccount ? `${selectedAccount.name} - Add Transaction` : 'Add Transaction'}
      >
        {selectedAccount && (
          <TransactionForm
            onSubmit={async (data) => {
              await handleTransaction(
                selectedAccount.id,
                data,
                () => {
                  toast({
                    title: "Transaction Successful",
                    description: `${data.type === 'transfer' 
                      ? `Successfully transferred ${formatLKR(data.amount)}`
                      : `${data.type === 'credit' ? 'Added' : 'Subtracted'} ${formatLKR(data.amount)}`
                    }`,
                  });
                  setIsTransactionModalOpen(false);
                  setSelectedAccount(null);
                  fetchAccounts();
                },
                (error) => {
                  toast({
                    title: "Transaction Failed",
                    description: error,
                    variant: "destructive",
                  });
                }
              );
            }}
            onClose={() => {
              setIsTransactionModalOpen(false);
              setSelectedAccount(null);
            }}
            accounts={accounts}
            selectedAccountId={selectedAccount.id}
            initialType="credit"
          />
        )}
      </Modal>

      <Modal
        isOpen={isTransactionDetailsOpen}
        onClose={() => {
          setIsTransactionDetailsOpen(false);
          setSelectedAccount(null);
          setCurrentPage(1);
        }}
        title={selectedAccount ? `${selectedAccount.name} - Transaction History` : 'Transaction History'}
        className="max-w-6xl w-full h-[90vh]"
      >
        {selectedAccount && (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-end space-x-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              {selectedAccount.transactions && selectedAccount.transactions.length > 0 && (
                <CSVLink
                  data={prepareCSVData(selectedAccount.transactions)}
                  filename={`${selectedAccount.name}-transactions.csv`}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </CSVLink>
              )}
            </div>

            <div id="transaction-details-print" className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg sticky top-0 z-10 bg-opacity-95">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-semibold">{formatLKR(selectedAccount.balance || 0)}</p>
                </div>
                {selectedAccount.bankDetails && (
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="text-lg font-semibold">{selectedAccount.bankDetails.accountNumber}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-6">
                <h3 className="font-medium">Recent Transactions</h3>
                {selectedAccount.transactions && selectedAccount.transactions.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {selectedAccount.transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice((currentPage - 1) * 5, currentPage * 5)
                        .map((transaction) => (
                          <div
                            key={transaction.id}
                            className="p-4 border rounded-lg flex justify-between items-center hover:bg-accent"
                          >
                            <div>
                              <p className="font-medium">
                                {transaction.type === 'credit' ? 'Credit' : 
                                 transaction.type === 'debit' ? 'Debit' : 'Transfer'}
                              </p>
                              <p className="text-sm text-muted-foreground">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className={`text-right ${
                              transaction.type === 'credit' ? 'text-green-600' : 
                              transaction.type === 'debit' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              <p className="font-semibold">
                                {transaction.type === 'credit' ? '+' : '-'}{formatLKR(transaction.amount)}
                              </p>
                              {transaction.transferToAccount && (
                                <p className="text-xs">
                                  To: {accounts.find(a => a.id === transaction.transferToAccount)?.name || 'Unknown Account'}
                                </p>
                              )}
                              {transaction.transferFromAccount && (
                                <p className="text-xs">
                                  From: {accounts.find(a => a.id === transaction.transferFromAccount)?.name || 'Unknown Account'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 sticky bottom-0 bg-background p-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * 5 + 1, selectedAccount.transactions.length)} to{' '}
                        {Math.min(currentPage * 5, selectedAccount.transactions.length)} of{' '}
                        {selectedAccount.transactions.length} transactions
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(selectedAccount.transactions!.length / 5), p + 1))}
                          disabled={currentPage === Math.ceil(selectedAccount.transactions.length / 5)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No transactions found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 