'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatLKR } from '@/lib/utils';

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
}

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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'transfer' && !formData.transferToAccount) {
      alert('Please select an account to transfer to');
      return;
    }
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
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'credit' | 'debit' | 'transfer' })}
        >
          <option value="credit">Credit (Add)</option>
          <option value="debit">Debit (Subtract)</option>
          <option value="transfer">Transfer to Another Account</option>
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