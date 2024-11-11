'use client';

import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useEffect } from 'react';
import { useDataOperations, Collection } from '@/hooks/useDataOperations';

interface TransactionFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  accountTypes: any[];
}

const paymentMethods = [
  { id: 'cash', name: 'Cash', requiresRef: false },
  { id: 'cheque', name: 'Cheque', requiresRef: true },
  { id: 'credit_card', name: 'Credit Card', requiresRef: true },
  { id: 'electronic_transfer', name: 'Electronic Transfer', requiresRef: true },
];

export function TransactionForm({ onSubmit, initialData, accountTypes }: TransactionFormProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {
      type: 'Income',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash'
    }
  });

  const transactionType = watch('type');
  const paymentMethod = watch('paymentMethod');
  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethod);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(event.target.files);
    }
  };

  const onSubmitForm = async (data: any) => {
    const formData = { ...data };

    if (files && files.length > 0 && data.type === 'Income') {
      const filePromises = Array.from(files).map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const attachments = await Promise.all(filePromises);
      formData.attachments = attachments;
    }

    onSubmit(formData);
  };

  const { items: categories } = useDataOperations('categories' as Collection);
  const { items: players } = useDataOperations('players' as Collection);
  const { items: staff } = useDataOperations('staff' as Collection);
  const { items: users } = useDataOperations('users' as Collection);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Transaction Type</label>
        <select
          {...register('type', { required: 'Transaction type is required' })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        {errors.type && <span className="text-red-500 text-sm">{errors.type.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Account Type</label>
        <select
          {...register('accountType', { required: 'Account type is required' })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          {accountTypes
            .filter(type => type.type === transactionType)
            .map(type => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
        </select>
        {errors.accountType && <span className="text-red-500 text-sm">{errors.accountType.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Payment Method</label>
        <select
          {...register('paymentMethod', { required: 'Payment method is required' })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          {paymentMethods.map(method => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
        {errors.paymentMethod && <span className="text-red-500 text-sm">{errors.paymentMethod.message?.toString()}</span>}
      </div>

      {selectedPaymentMethod?.requiresRef && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {selectedPaymentMethod.name} Reference Number
          </label>
          <Input
            {...register('referenceNumber', { 
              required: selectedPaymentMethod.requiresRef ? 'Reference number is required' : false 
            })}
            placeholder={`Enter ${selectedPaymentMethod.name} reference number`}
          />
          {errors.referenceNumber && (
            <span className="text-red-500 text-sm">{errors.referenceNumber.message?.toString()}</span>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <Input
          {...register('amount', { 
            required: 'Amount is required',
            min: { value: 0, message: 'Amount must be positive' }
          })}
          type="number"
          step="0.01"
          placeholder="Enter amount"
        />
        {errors.amount && <span className="text-red-500 text-sm">{errors.amount.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <Input
          {...register('date', { required: 'Date is required' })}
          type="date"
          defaultValue={new Date().toISOString().split('T')[0]}
        />
        {errors.date && <span className="text-red-500 text-sm">{errors.date.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          {...register('description')}
          placeholder="Enter transaction description"
          className="min-h-[100px]"
        />
      </div>

      {transactionType === 'Income' && (
        <div>
          <label className="block text-sm font-medium mb-1">Attachments</label>
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            multiple
            onChange={handleFileChange}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported files: PDF, DOC, DOCX, PNG, JPG, JPEG
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          {...register('category', { required: 'Category is required' })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <option value="">Select Category</option>
          {categories
            .filter(cat => cat.type === transactionType && cat.status === 'Active')
            .map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
        {errors.category && <span className="text-red-500 text-sm">{errors.category.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Payee</label>
        <select
          {...register('payee', { required: 'Payee is required' })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <option value="">Select Payee</option>
          <optgroup label="Players">
            {players.map(player => (
              <option key={`player-${player.id}`} value={`player-${player.id}`}>
                {player.name} (Player)
              </option>
            ))}
          </optgroup>
          <optgroup label="Staff">
            {staff.map(member => (
              <option key={`staff-${member.id}`} value={`staff-${member.id}`}>
                {member.name} ({member.role})
              </option>
            ))}
          </optgroup>
          <optgroup label="Other Users">
            {users.map(user => (
              <option key={`user-${user.id}`} value={`user-${user.id}`}>
                {user.name} ({user.role})
              </option>
            ))}
          </optgroup>
        </select>
        {errors.payee && <span className="text-red-500 text-sm">{errors.payee.message?.toString()}</span>}
      </div>

      <Button type="submit" className="w-full">
        {initialData ? 'Update' : 'Add'} Transaction
      </Button>
    </form>
  );
} 