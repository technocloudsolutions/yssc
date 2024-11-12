import { AuthWrapper } from '@/components/providers/AuthWrapper';

export default function Home() {
  return (
    <AuthWrapper>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div>
          <h1>Welcome to the Dashboard</h1>
        </div>
      </main>
    </AuthWrapper>
  );
} 