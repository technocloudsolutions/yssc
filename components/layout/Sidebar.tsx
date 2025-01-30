'use client';

import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Settings,
  Home,
  UserCog,
  TrendingUp,
  UserPlus,
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Building2,
  FileText,
  PieChart,
  TrendingDown,
  Calendar,
  Filter,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const Sidebar = () => {
  const { user } = useAuth();
  const [menuItems] = useState([
    { title: 'Dashboard', icon: Home, href: '/' },
    { title: 'Players', icon: Users, href: '/players' },
    { title: 'Member', icon: UserCog, href: '/staff' },
    { title: 'Attendance', icon: Calendar, href: '/attendance' },
    { title: 'Sponsors', icon: Building2, href: '/sponsors' },
    { title: 'Finance', icon: DollarSign, href: '/finance' },
    { title: 'Bank Accounts', icon: Building2, href: '/bank-accounts' },
    { title: 'Advanced Reports', icon: FileText, href: '/advanced-reports' },
    { title: 'Performance', icon: TrendingUp, href: '/performance' },
    { title: 'Settings', icon: Settings, href: '/settings' },
    { title: 'User Management', icon: UserPlus, href: '/users' },
  ]);

  const reportSubItems = [
    {
      title: "Income Analysis",
      icon: TrendingUp,
      href: "/advanced-reports/income"
    },
    {
      title: "Expense Analysis",
      icon: TrendingDown,
      href: "/advanced-reports/expenses"
    },
    {
      title: "Player Finance",
      icon: Users,
      href: "/advanced-reports/player-finance"
    },
    {
      title: "Staff Finance",
      icon: UserCog,
      href: "/advanced-reports/staff"
    },
    {
      title: "Sponsor Finance",
      icon: Building2,
      href: "/advanced-reports/sponsor"
    },
    {
      title: "Bank Account",
      icon: Building2,
      href: "/advanced-reports/bank-account"
    }
  ];

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
          <div key={item.title}>
            <Link
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-yellow-500/10 hover:text-yellow-500"
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.title}
            </Link>
            {item.title === 'Advanced Reports' && (
              <div className="ml-4 border-l border-gray-200 dark:border-gray-800">
                {reportSubItems.map((subItem) => (
                  <Link
                    key={subItem.title}
                    href={subItem.href}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-500"
                  >
                    <subItem.icon className="h-4 w-4 mr-3" />
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 