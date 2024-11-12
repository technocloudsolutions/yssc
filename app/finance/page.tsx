'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, FileText, Image as ImageIcon, File, X, Info, ClipboardList, User, Paperclip, Upload, FileType, Link2, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDataOperations, Collection } from '@/hooks/useDataOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transaction {
  id: string;
  date: string;
  accountType: string;
  category: string;
  amount: number;
  description: string;
  attachments?: string[];
  status: 'Pending' | 'Completed' | 'Cancelled';
  type: 'Income' | 'Expense';
  createdAt: string;
  updatedAt?: string;
}

const STATUS_OPTIONS = ['Pending', 'Completed', 'Cancelled'] as const;
const TYPE_OPTIONS = ['Income', 'Expense'] as const;
const EXPENSE_PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Check',
  'Online Payment'
] as const;
const EXPENSE_CATEGORIES = [
  'Player Salaries',
  'Staff Wages',
  'Equipment',
  'Travel',
  'Facility Maintenance',
  'Medical',
  'Training',
  'Marketing',
  'Insurance',
  'Utilities'
] as const;
const EXPENSE_ACCOUNT_TYPES = [
  'Operating Expenses',
  'Player Expenses',
  'Staff Expenses',
  'Facility Expenses',
  'Equipment Expenses',
  'Travel Expenses',
  'Medical Expenses',
  'Administrative Expenses'
] as const;
const PAYEE_TYPES = [
  'Player',
  'Staff',
  'Vendor',
  'Contractor',
  'Service Provider',
  'Utility Company',
  'Insurance Company',
  'Other'
] as const;

// Add payment methods for income
const INCOME_PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Check',
  'Online Payment',
  'Mobile Payment'
] as const;

// Add this interface for form data type
interface TransactionFormData {
  date: string;
  transactionType: 'Income' | 'Expense';
  accountType: string;
  paymentMethod: string;
  amount: number;
  description: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  category: string;
  payee: string;
  payeeType: string;
  attachments: string[];
}

// Add this helper function for file icons
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
};

// Add this validation function near the top of the component
const validateForm = (data: TransactionFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.date) errors.push("Date is required");
  if (!data.transactionType) errors.push("Transaction type is required");
  if (!data.accountType) errors.push("Account type is required");
  if (!data.paymentMethod) errors.push("Payment method is required");
  if (!data.amount || data.amount <= 0) errors.push("Valid amount is required");
  if (!data.description.trim()) errors.push("Description is required");
  if (!data.status) errors.push("Status is required");
  if (!data.category) errors.push("Category is required");
  
  // Validate payee information for expenses
  if (data.transactionType === 'Expense') {
    if (!data.payeeType) errors.push("Payee type is required");
    if (!data.payee.trim()) errors.push("Payee name is required");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { items: transactionItems, formatAmount } = useDataOperations('transactions' as Collection);
  const [accountTypes, setAccountTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [payeeSuggestions, setPayeeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<TransactionFormData>({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'Income',
    accountType: '',
    paymentMethod: 'Cash',
    amount: 0,
    description: '',
    status: 'Pending',
    category: '',
    payee: '',
    payeeType: '',
    attachments: []
  });

  const [uploading, setUploading] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [currentAttachments, setCurrentAttachments] = useState<string[]>([]);
  const [showAttachments, setShowAttachments] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchAccountTypes();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const snapshot = await getDocs(transactionsRef);
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const accountTypesRef = collection(db, 'accountTypes');
      const snapshot = await getDocs(accountTypesRef);
      const accountTypeNames = snapshot.docs.map(doc => doc.data().name);
      setAccountTypes(accountTypeNames);
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const categoryNames = snapshot.docs.map(doc => doc.data().name);
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const calculateFinancialStats = () => {
    const completedTransactions = transactions.filter(t => t.status === 'Completed');
    const totalIncome = completedTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = completedTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const pendingTransactions = transactions.filter(t => t.status === 'Pending').length;

    return { totalIncome, totalExpenses, balance, pendingTransactions };
  };

  const stats = calculateFinancialStats();

  const fetchPayeeSuggestions = async (type: string) => {
    try {
      let collectionName = '';
      switch (type) {
        case 'Player':
          collectionName = 'players';
          break;
        case 'Staff':
          collectionName = 'staff';
          break;
        default:
          return;
      }

      const querySnapshot = await getDocs(collection(db, collectionName));
      const names = querySnapshot.docs.map(doc => doc.data().name);
      setPayeeSuggestions(names);
    } catch (error) {
      console.error('Error fetching payee suggestions:', error);
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const { isValid, errors } = validateForm(formData);
    
    if (!isValid) {
      // Show error toast with all validation errors
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: (
          <div className="space-y-2">
            <p>Please fix the following errors:</p>
            <ul className="list-disc pl-4">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )
      });
      return;
    }

    try {
      setUploading(true); // Show loading state
      
      const transactionData = {
        ...formData,
        type: formData.transactionType,
        amount: Number(formData.amount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingTransaction) {
        const transactionRef = doc(db, 'transactions', editingTransaction.id);
        await updateDoc(transactionRef, transactionData);
        toast({
          variant: "success",
          title: "Success",
          description: "Transaction updated successfully"
        });
      } else {
        await addDoc(collection(db, 'transactions'), transactionData);
        toast({
          variant: "success",
          title: "Success",
          description: "Transaction added successfully"
        });
      }
      
      setIsModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save transaction. Please try again."
      });
    } finally {
      setUploading(false); // Hide loading state
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        fetchTransactions();
        toast({
          variant: "success",
          title: "Success",
          description: "Transaction deleted successfully"
        });
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete transaction"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      transactionType: 'Income',
      accountType: '',
      paymentMethod: 'Cash',
      amount: 0,
      description: '',
      status: 'Pending',
      category: '',
      payee: '',
      payeeType: '',
      attachments: []
    });
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      transactionType: transaction.type,
      accountType: transaction.accountType,
      paymentMethod: 'Cash',
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      category: transaction.category,
      payee: '',
      payeeType: '',
      attachments: transaction.attachments || []
    });
    setIsModalOpen(true);
  };

  // Fix the handleFileUpload function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `transactions/${file.name}-${Date.now()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedUrls]
      }));

      toast({
        variant: "success",
        title: "Success",
        description: "Files uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload files"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Move columns definition here, inside the component
  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'accountType', label: 'Account Type', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (transaction: Transaction) => (
        <span className={transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
          {formatAmount(transaction.amount)}
        </span>
      )
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'attachments',
      label: 'Attachments',
      sortable: false,
      render: (transaction: Transaction) => {
        if (!transaction.attachments?.length) {
          return <span className="text-muted-foreground">No attachments</span>;
        }
        
        return (
          <div className="flex gap-2">
            {transaction.attachments.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Download {index + 1}
                </Button>
              </a>
            ))}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financial Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
              <h3 className="text-2xl font-bold text-green-600">
                {formatAmount(stats.totalIncome)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <h3 className="text-2xl font-bold text-red-600">
                {formatAmount(stats.totalExpenses)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <PiggyBank className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
              <h3 className="text-2xl font-bold text-blue-600">
                {formatAmount(stats.balance)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button onClick={() => setIsModalOpen(true)}>Add Transaction</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        renderCustomCell={(column, item) => {
          if (column.render) {
            return column.render(item);
          }
          return item[column.key];
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
          resetForm();
        }}
        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Basic Info</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Details</span>
              </TabsTrigger>
              {formData.transactionType === 'Expense' && (
                <TabsTrigger value="payee" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Payee</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="attachments" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span>Attachments</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Transaction Type</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      transactionType: e.target.value as 'Income' | 'Expense'
                    })}
                    required
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                    className="focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Account Type</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    required
                  >
                    <option value="">Select Account Type</option>
                    {formData.transactionType === 'Expense' 
                      ? EXPENSE_ACCOUNT_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))
                      : accountTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="">Select Payment Method</option>
                    {(formData.transactionType === 'Expense' ? EXPENSE_PAYMENT_METHODS : INCOME_PAYMENT_METHODS)
                      .map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {(formData.transactionType === 'Expense' ? EXPENSE_CATEGORIES : categories)
                      .map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                    value={formData.status}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      status: e.target.value as typeof STATUS_OPTIONS[number]
                    })}
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md bg-background min-h-[100px] focus:ring-2 focus:ring-primary"
                    placeholder="Enter transaction description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            {/* Payee Tab - Only for Expenses */}
            {formData.transactionType === 'Expense' && (
              <TabsContent value="payee" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Payee Type</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                      value={formData.payeeType}
                      onChange={(e) => {
                        setFormData({ ...formData, payeeType: e.target.value });
                        fetchPayeeSuggestions(e.target.value);
                      }}
                      required
                    >
                      <option value="">Select Payee Type</option>
                      {PAYEE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">Payee Name</label>
                    <Input
                      placeholder="Enter payee name"
                      value={formData.payee}
                      onChange={(e) => {
                        setFormData({ ...formData, payee: e.target.value });
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      required
                      className="focus:ring-2 focus:ring-primary"
                    />
                    {showSuggestions && payeeSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-background border rounded-md mt-1 max-h-40 overflow-y-auto">
                        {payeeSuggestions
                          .filter(name => 
                            name.toLowerCase().includes(formData.payee.toLowerCase())
                          )
                          .map((name, index) => (
                            <div
                              key={index}
                              className="p-2 hover:bg-muted cursor-pointer"
                              onClick={() => {
                                setFormData({ ...formData, payee: name });
                                setShowSuggestions(false);
                              }}
                            >
                              {name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                    />
                    <span className="text-sm font-medium">Click to upload files</span>
                    <span className="text-xs text-muted-foreground">
                      Supported files: PDF, DOC, DOCX, PNG, JPG, JPEG
                    </span>
                  </label>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileType className="h-4 w-4" />
                      Attached Files
                    </h4>
                    <div className="divide-y divide-border rounded-md border">
                      {formData.attachments.map((file, index) => {
                        const fileName = file.split('/').pop()?.split('-')[0] || `Attachment ${index + 1}`;
                        return (
                          <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file)}
                              <span className="text-sm font-medium">{fileName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-blue-500 hover:text-blue-600"
                              >
                                <a 
                                  href={file} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <Link2 className="h-4 w-4" />
                                  <span>View</span>
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAttachment(index)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTransaction(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary"
              disabled={uploading}
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {editingTransaction ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                editingTransaction ? 'Update' : 'Add'
              )} Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 