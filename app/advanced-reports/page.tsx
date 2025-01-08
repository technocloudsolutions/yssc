'use client';

import { Card } from '@/components/ui/card';
import { FileText, TrendingUp, TrendingDown, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdvancedReports() {
  const reports = [
    {
      title: 'Income Analysis',
      description: 'Track and analyze all income sources',
      icon: TrendingUp,
      href: '/advanced-reports/income'
    },
    {
      title: 'Expense Analysis',
      description: 'Monitor and analyze all expenses',
      icon: TrendingDown,
      href: '/advanced-reports/expenses'
    },
    {
      title: 'Player Finance',
      description: 'View and filter player-related financial data',
      icon: Users,
      href: '/advanced-reports/player-finance'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Advanced Reports</h1>
        <p className="text-gray-500">Access detailed financial reports and analytics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <report.icon className="h-8 w-8 mb-4 text-primary" />
              <h2 className="text-lg font-semibold mb-2">{report.title}</h2>
              <p className="text-gray-500">{report.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 