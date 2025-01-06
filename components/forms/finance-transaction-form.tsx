'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatLKR } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Inactive';
}

interface FinanceTransactionFormProps {
  onSubmit: (data: FinanceTransactionFormData) => void;
  onClose: () => void;
}

export interface FinanceTransactionFormData {
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Check',
  'Online Payment'
] as const;

const STATUS_OPTIONS = ['Pending', 'Completed', 'Cancelled'] as const;

export function FinanceTransactionForm({ onSubmit, onClose }: FinanceTransactionFormProps) {
  const [formData, setFormData] = useState<FinanceTransactionFormData>({
    date: new Date().toISOString().split('T')[0],
    type: 'Income',
    category: '',
    amount: 0,
    description: '',
    paymentMethod: 'Cash',
    status: 'Pending'
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
        
        const activeCategories = fetchedCategories.filter(cat => 
          cat.status === 'Active'
        );
        
        setCategories(activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => 
    category.type === formData.type
  );

  // Sort categories alphabetically
  const sortedCategories = [...filteredCategories].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Transaction Type</Label>
        <select
          id="type"
          className="w-full p-2 border rounded"
          value={formData.type}
          onChange={(e) => setFormData({ 
            ...formData, 
            type: e.target.value as 'Income' | 'Expense',
            category: '' // Reset category when type changes
          })}
          required
        >
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          className="w-full p-2 border rounded"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          <option value="">Select Category</option>
          {sortedCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

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

      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <select
          id="paymentMethod"
          className="w-full p-2 border rounded"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ 
            ...formData, 
            paymentMethod: e.target.value
          })}
          required
        >
          <option value="">Select Payment Method</option>
          {PAYMENT_METHODS.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="w-full p-2 border rounded"
          value={formData.status}
          onChange={(e) => setFormData({ 
            ...formData, 
            status: e.target.value as 'Pending' | 'Completed' | 'Cancelled'
          })}
          required
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

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