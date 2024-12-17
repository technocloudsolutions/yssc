'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await login(data.email, data.password);
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1A2C] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Image 
            src="/logo.png"
            alt="Young Silver Sports Club Logo"
            width={100}
            height={100}
            priority
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-center text-[#FFD700] mb-2">
            Young Silver Sports Club
          </h1>
          <h2 className="text-xl text-center text-[#FFD700]/80">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-500 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#FFD700]">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="mt-1 bg-[#152A3F] border-[#FFD700]/30 text-[#FFD700] 
                          placeholder:text-[#FFD700]/50 focus:border-[#FFD700] 
                          focus:ring-[#FFD700]/20"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message?.toString()}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#FFD700]">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', { required: 'Password is required' })}
                className="mt-1 bg-[#152A3F] border-[#FFD700]/30 text-[#FFD700] 
                          placeholder:text-[#FFD700]/50 focus:border-[#FFD700] 
                          focus:ring-[#FFD700]/20"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message?.toString()}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 bg-[#FFD700] hover:bg-[#FFD700]/90 
                     text-[#0A1A2C] font-semibold transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6">
          <p className="text-center text-sm text-[#FFD700]/60">
            © {new Date().getFullYear()} Young Silver Sports Club. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 