'use client';

import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AccountTypeFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function AccountTypeForm({ onSubmit, initialData }: AccountTypeFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      type: 'Income',
      status: 'Active'
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Account Name</label>
        <Input
          {...register('name', { required: 'Account name is required' })}
          placeholder="Enter account name"
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          {...register('type', { required: 'Type is required' })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          {...register('description')}
          placeholder="Enter account description"
          className="min-h-[100px]"
        />
      </div>

      {initialData && (
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      )}

      <Button type="submit" className="w-full">
        {initialData ? 'Update Account Type' : 'Add Account Type'}
      </Button>
    </form>
  );
} 