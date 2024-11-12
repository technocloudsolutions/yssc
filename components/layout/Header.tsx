'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      toast({
        title: "Logged out successfully",
        description: "Please log in to continue using the system.",
        duration: 3000,
      });
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <header className="border-b border-border h-14 px-6 flex items-center justify-between">
      <div></div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {user ? (
          <>
            <span className="text-sm text-muted-foreground">
              {userData?.name} ({userData?.role})
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogin}
            className="flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        )}
      </div>
    </header>
  );
} 