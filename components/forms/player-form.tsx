'use client';

import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { useState } from 'react';
import Image from 'next/image';

interface PlayerFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe'
].sort();

export function PlayerForm({ onSubmit, initialData }: PlayerFormProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.profilePicture || null);
  
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      country: 'Sri Lanka',
    },
    mode: 'onSubmit',
    resolver: async (values) => {
      const errors: any = {};
      if (!values.name || values.name.trim() === '') {
        errors.name = {
          type: 'required',
          message: 'Name is required'
        };
      }
      return {
        values,
        errors
      };
    }
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

      {/* Existing form fields... */}
      <div>
        <Input
          {...register('name')}
          placeholder="Full Name"
        />
        {errors.name && <span className="text-red-500">{errors.name.message?.toString()}</span>}
      </div>

      <div>
        <Input
          {...register('email')}
          type="email"
          placeholder="Email (Optional)"
        />
      </div>

      <div>
        <Input
          {...register('phone')}
          placeholder="Phone (Optional)"
        />
      </div>

      <div>
        <Input
          {...register('address')}
          placeholder="Address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('city')}
          placeholder="City"
        />
        <Input
          {...register('stateRegion')}
          placeholder="State/Region"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('postalCode')}
          placeholder="ZIP/Postal Code"
        />
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                {field.value || 'Select Country'}
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('nicNo')}
          placeholder="NIC No (Optional)"
        />
        <Input
          {...register('ffslNo')}
          placeholder="FFSL No (Optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Date of Birth (Optional)
        </label>
        <Input
          {...register('dateOfBirth')}
          type="date"
          placeholder="Date of Birth"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Join Date (Optional)
        </label>
        <Input
          {...register('joinDate')}
          type="date"
          placeholder="Join Date"
          defaultValue={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('position')}
          placeholder="Position"
        />
        <Input
          {...register('jerseyNumber')}
          type="number"
          placeholder="Jersey Number"
        />
      </div>

      <Button type="submit" className="w-full">
        {initialData ? 'Update Player' : 'Add Player'}
      </Button>
    </form>
  );
} 