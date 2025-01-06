'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatLKR } from '@/lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Category {
  id: string;
  name: string;
  type: 'Income' | 'Expense';
  status: 'Active' | 'Inactive';
}

interface AccountType {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  balance?: number;
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  onClose: () => void;
  accounts: AccountType[];
  selectedAccountId: string;
  initialType?: 'credit' | 'debit' | 'transfer';
}

export interface TransactionFormData {
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description: string;
  transferToAccount?: string;
  receivedFrom?: string;
  receivedFromType?: string;
  category?: string;
  accountType?: string;
}

const RECEIVED_FROM_TYPES = [
  'Player',
  'Staff',
  'Sponsor',
  'Member',
  'Event',
  'Donation',
  'Other'
] as const;

export function TransactionForm({ 
  onSubmit, 
  onClose,
  accounts,
  selectedAccountId,
  initialType = 'credit'
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: 0,
    type: initialType,
    description: '',
    receivedFrom: '',
    receivedFromType: '',
    category: '',
    accountType: selectedAccountId
  });

  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const fetchedCategories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        // Only get active categories
        const activeCategories = fetchedCategories.filter(cat => 
          cat.status === 'Active' && 
          (cat.type === 'Income' || cat.type === 'Expense')
        );
        setCategories(activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => {
    if (formData.type === 'debit') {
      return category.type === 'Expense';
    }
    if (formData.type === 'credit') {
      return category.type === 'Income';
    }
    return false;
  });

  // Sort categories alphabetically
  const sortedCategories = [...filteredCategories].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Sort accounts alphabetically
  const sortedAccounts = [...accounts].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  useEffect(() => {
    // Reset category when transaction type changes
    setFormData(prev => ({
      ...prev,
      category: ''
    }));
  }, [formData.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'transfer' && !formData.transferToAccount) {
      alert('Please select an account to transfer to');
      return;
    }
    if (formData.type === 'credit' && (!formData.receivedFrom || !formData.receivedFromType)) {
      alert('Please fill in who the payment was received from');
      return;
    }
    if ((formData.type === 'credit' || formData.type === 'debit') && !formData.category) {
      alert('Please select a category');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="accountType">Account</Label>
        <select
          id="accountType"
          className="w-full p-2 border rounded"
          value={selectedAccountId}
          onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
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

      <div>
        <Label htmlFor="type">Transaction Type</Label>
        <select
          id="type"
          className="w-full p-2 border rounded"
          value={formData.type}
          onChange={(e) => setFormData({ 
            ...formData, 
            type: e.target.value as 'credit' | 'debit' | 'transfer',
            category: '', // Reset category when type changes
            receivedFrom: '', // Reset received from
            receivedFromType: '' // Reset received from type
          })}
        >
          <option value="credit">Credit (Add)</option>
          <option value="debit">Debit (Subtract)</option>
          <option value="transfer">Transfer to Another Account</option>
        </select>
      </div>

      {(formData.type === 'credit' || formData.type === 'debit') && (
        <div>
          <Label htmlFor="category">
            {formData.type === 'credit' ? 'Income Category' : 'Expense Category'}
          </Label>
          <select
            id="category"
            className="w-full p-2 border rounded"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Select {formData.type === 'credit' ? 'Income' : 'Expense'} Category</option>
            {sortedCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label htmlFor="amount">Amount (LKR)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          required
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
        />
      </div>

      {formData.type === 'credit' && (
        <>
          <div>
            <Label htmlFor="receivedFromType">Received From (Type)</Label>
            <select
              id="receivedFromType"
              className="w-full p-2 border rounded"
              value={formData.receivedFromType}
              onChange={(e) => setFormData({ ...formData, receivedFromType: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              {RECEIVED_FROM_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="receivedFrom">Received From (Name)</Label>
            <Input
              id="receivedFrom"
              required
              value={formData.receivedFrom}
              onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })}
              placeholder="Enter name"
            />
          </div>
        </>
      )}

      {formData.type === 'transfer' && (
        <div>
          <Label htmlFor="transferTo">Transfer To</Label>
          <select
            id="transferTo"
            className="w-full p-2 border rounded"
            value={formData.transferToAccount || ''}
            onChange={(e) => setFormData({ ...formData, transferToAccount: e.target.value })}
            required={formData.type === 'transfer'}
          >
            <option value="">Select Account</option>
            {accounts
              .filter(account => account.id !== selectedAccountId && account.status === 'Active')
              .map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatLKR(account.balance || 0)})
                </option>
              ))}
          </select>
        </div>
      )}

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Submit Transaction</Button>
      </div>
    </form>
  );
} 