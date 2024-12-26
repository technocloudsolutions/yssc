'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCog,
  PieChart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

const reportTypes = [
  {
    title: 'Player Analytics',
    icon: Users,
    description: 'Comprehensive player statistics, performance metrics, and financial data',
    href: '/advanced-reports/players',
    metrics: ['Total Players', 'Active Contracts', 'Performance Trends', 'Financial Summary']
  },
  {
    title: 'Staff Reports',
    icon: UserCog,
    description: 'Staff management reports including roles, departments, and performance',
    href: '/advanced-reports/staff',
    metrics: ['Staff Count', 'Department Distribution', 'Role Analysis', 'Performance Reviews']
  },
  {
    title: 'Financial Overview',
    icon: PieChart,
    description: 'Complete financial analysis with trends, forecasts, and comparisons',
    href: '/advanced-reports/finance',
    metrics: ['Revenue', 'Expenses', 'Profit/Loss', 'Budget Analysis']
  },
  {
    title: 'Income Analysis',
    icon: TrendingUp,
    description: 'Detailed breakdown of all income sources and trends',
    href: '/advanced-reports/income',
    metrics: ['Total Income', 'Source Distribution', 'Monthly Trends', 'YoY Comparison']
  },
  {
    title: 'Expense Analysis',
    icon: TrendingDown,
    description: 'Comprehensive expense tracking and categorization',
    href: '/advanced-reports/expenses',
    metrics: ['Total Expenses', 'Category Breakdown', 'Monthly Analysis', 'Cost Centers']
  },
  {
    title: 'Category Analysis',
    icon: BarChart3,
    description: 'Detailed analysis of all categories with financial impact',
    href: '/advanced-reports/categories',
    metrics: ['Category Distribution', 'Trends', 'Impact Analysis', 'Comparisons']
  }
];

export default function AdvancedReportsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reportTypes.map((report) => (
        <Card key={report.title} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <report.icon className="h-6 w-6 text-primary" />
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={report.href} className="flex items-center gap-2">
                View Report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">{report.title}</h3>
          <p className="text-muted-foreground mb-4">{report.description}</p>
          
          <div className="grid grid-cols-2 gap-3">
            {report.metrics.map((metric) => (
              <div
                key={metric}
                className="text-sm p-2 bg-muted/50 rounded-md text-muted-foreground"
              >
                {metric}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
} 