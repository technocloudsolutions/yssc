'use client';

import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Image from 'next/image';

interface StaffFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function StaffForm({ onSubmit, initialData }: StaffFormProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.profilePicture || null);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {}
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmitForm = (data: any) => {
    // Include the profile picture in the form data
    onSubmit({
      ...data,
      profilePicture: previewImage
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {/* Profile Picture Upload Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Profile Preview"
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Profile Picture
          </label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full max-w-xs"
          />
          {errors.profilePicture && (
            <span className="text-red-500 text-sm">{errors.profilePicture.message?.toString()}</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input
          {...register('name', { required: 'Name is required' })}
          defaultValue={initialData?.name}
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
          defaultValue={initialData?.email}
          placeholder="Email Address"
        />
        {errors.email && <span className="text-red-500 text-sm">{errors.email.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          {...register('role', { required: 'Role is required' })}
          defaultValue={initialData?.role}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <option value="Head Coach">Head Coach</option>
          <option value="Assistant Coach">Assistant Coach</option>
          <option value="Physiotherapist">Physiotherapist</option>
          <option value="Fitness Trainer">Fitness Trainer</option>
          <option value="Scout">Scout</option>
        </select>
        {errors.role && <span className="text-red-500 text-sm">{errors.role.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Department</label>
        <select
          {...register('department', { required: 'Department is required' })}
          defaultValue={initialData?.department}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <option value="Coaching">Coaching</option>
          <option value="Medical">Medical</option>
          <option value="Fitness">Fitness</option>
          <option value="Scouting">Scouting</option>
        </select>
        {errors.department && <span className="text-red-500 text-sm">{errors.department.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <Input
          {...register('address')}
          defaultValue={initialData?.address}
          placeholder="Street Address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <Input
            {...register('city')}
            defaultValue={initialData?.city}
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State/Region</label>
          <Input
            {...register('stateRegion')}
            defaultValue={initialData?.stateRegion}
            placeholder="State/Region"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Join Date</label>
        <Input
          {...register('joinDate', { required: 'Join Date is required' })}
          type="date"
          defaultValue={initialData?.joinDate}
        />
        {errors.joinDate && <span className="text-red-500 text-sm">{errors.joinDate.message?.toString()}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contact</label>
        <Input
          {...register('contact', { required: 'Contact number is required' })}
          type="tel"
          defaultValue={initialData?.contact}
          placeholder="Phone Number"
        />
        {errors.contact && <span className="text-red-500 text-sm">{errors.contact.message?.toString()}</span>}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="submit" className="w-full">
          {initialData ? 'Update' : 'Add'} Staff Member
        </Button>
      </div>
    </form>
  );
} 