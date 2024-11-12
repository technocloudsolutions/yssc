'use client';

import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
  // Get the server session
  const session = await getServerSession(authOptions);

  // If no session exists, redirect to login
  if (!session) {
    redirect("/auth/signin");
    return null;
  }

  // If session exists but no user or role, handle the error
  if (!session.user || !session.user.role) {
    console.error("Invalid session structure:", session);
    redirect("/auth/signin");
    return null;
  }

  // Redirect based on user role
  if (session.user.role === "admin") {
    redirect("/dashboard");
  } else if (session.user.role === "user") {
    redirect("/user-dashboard");
  }

  return null;
}
