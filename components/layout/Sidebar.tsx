'use client';

import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  FileText, 
  Settings,
  Home,
  UserCog,
  TrendingUp,
  UserPlus,
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Building2,
  ArrowUpCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const Sidebar = () => {
  const { user } = useAuth();
  const [menuItems] = useState([
    { title: 'Dashboard', icon: Home, href: '/' },
    { title: 'Players', icon: Users, href: '/players' },
    { title: 'Staff', icon: UserCog, href: '/staff' },
    { title: 'Finance', icon: DollarSign, href: '/finance' },
    { title: 'Bank Accounts', icon: Building2, href: '/bank-accounts' },
    { title: 'Reports', icon: FileText, href: '/reports' },
    { title: 'Player Expenses', icon: ClipboardList, href: '/reports/player-expenses' },
    { title: 'Player Income', icon: ArrowUpCircle, href: '/reports/player-income' },
    { title: 'Category Expenses', icon: BarChart3, href: '/reports/category-expenses' },
    { title: 'Performance', icon: TrendingUp, href: '/performance' },
    { title: 'Settings', icon: Settings, href: '/settings' },
    { title: 'User Management', icon: UserPlus, href: '/settings/users' },
  ]);

  // If user is not logged in, don't render the sidebar
  if (!user) {
    return null;
  }

  return (
    <div className="w-64 bg-sidebar-bg border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-primary">YSSC Admin</h1>
      </div>
      <nav className="mt-8 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-yellow-500/10 hover:text-yellow-500"
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 