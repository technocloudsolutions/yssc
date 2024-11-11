'use client';

import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface DepartmentFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function DepartmentForm({ onSubmit, initialData }: DepartmentFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {}
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Department Name</label>
        <Input
          {...register('name', { required: 'Department name is required' })}
          placeholder="Enter department name"
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          {...register('description')}
          placeholder="Enter department description"
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit" className="w-full">
        {initialData ? 'Update Department' : 'Add Department'}
      </Button>
    </form>
  );
} 