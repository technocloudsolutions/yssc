import { AuthWrapper } from '@/components/providers/AuthWrapper';
import Image from 'next/image';

export default function Home() {
  return (
    <AuthWrapper>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center gap-4">
          <Image 
            src="/logo.png"
            alt="Young Silver Sports Club Logo"
            width={120}
            height={120}
            priority
          />
          <h1 className="text-4xl font-bold text-center">
            Young Silver Sports Club
          </h1>
        </div>
      </main>
    </AuthWrapper>
  );
} 