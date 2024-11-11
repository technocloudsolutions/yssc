'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RoleFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  departments: any[];
}

export function RoleForm({ onSubmit, initialData, departments }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    description: '',
    ...initialData
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        department: initialData.department || '',
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-2">Role Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Department</label>
        <select
          className="w-full p-2 border rounded-md bg-background"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.name} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-2">Description</label>
        <textarea
          className="w-full p-2 border rounded-md bg-background min-h-[100px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {initialData ? 'Update' : 'Add'} Role
        </Button>
      </div>
    </form>
  );
} 