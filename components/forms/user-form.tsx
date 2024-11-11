'use client';

import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

interface UserFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

const roles = ['Admin', 'Accountant', 'User'];
const statuses = ['Active', 'Inactive'];

export function UserForm({ onSubmit, initialData }: UserFormProps) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      role: 'User',
      status: 'Active'
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <Input
          {...register('name', { required: 'Name is required' })}
          placeholder="Full Name"
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          type="email"
          placeholder="Email Address"
        />
        {errors.email && <span className="text-red-500 text-sm">{errors.email.message?.toString()}</span>}
      </div>

      {!initialData && (
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            type="password"
            placeholder="Password"
          />
          {errors.password && <span className="text-red-500 text-sm">{errors.password.message?.toString()}</span>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          {...register('role', { required: 'Role is required' })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          {roles.map(role => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {errors.role && <span className="text-red-500 text-sm">{errors.role.message?.toString()}</span>}
      </div>

      {initialData && (
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" className="w-full">
        {initialData ? 'Update User' : 'Add User'}
      </Button>
    </form>
  );
} 