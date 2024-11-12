import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/auth'

export default async function Home() {
  const session = await getServerSession(authOptions) as Session | null

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        {session ? (
          <>
            <p>Signed in as {session.user?.email}</p>
            <a href="/api/auth/signout">Sign out</a>
          </>
        ) : (
          <a href="/api/auth/signin">Sign in</a>
        )}
      </div>
    </main>
  )
} 