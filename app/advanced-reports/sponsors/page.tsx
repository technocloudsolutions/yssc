'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

interface Transaction {
  id: string;
  date: string;
  accountType: string;
  category: string;
  amount: number;
  description: string;
  type: 'Income' | 'Expense';
  status: 'Pending' | 'Completed' | 'Cancelled';
  receivedFrom?: string;
  receivedFromType?: string;
}

interface SponsorshipStats {
  totalSponsors: number;
  activeSponsors: number;
  totalAmount: number;
  byType: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  byStatus: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  byCategory: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
}

export default function SponsorsReportPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<SponsorshipStats>({
    totalSponsors: 0,
    activeSponsors: 0,
    totalAmount: 0,
    byType: {},
    byStatus: {},
    byCategory: {},
  });
  const [date, setDate] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  useEffect(() => {
    fetchTransactions();
  }, [date]);

  const fetchTransactions = async () => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const snapshot = await getDocs(transactionsRef);
      const transactionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      // Filter for sponsor-related transactions
      const sponsorTransactions = transactionsList.filter(t => 
        t.type === 'Income' && 
        t.receivedFromType === 'Sponsor' &&
        t.status === 'Completed'
      );

      setTransactions(sponsorTransactions);
      calculateStats(sponsorTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sponsorTransactions: Transaction[]) => {
    const stats: SponsorshipStats = {
      totalSponsors: new Set(sponsorTransactions.map(t => t.receivedFrom)).size,
      activeSponsors: new Set(sponsorTransactions.filter(t => 
        new Date(t.date) <= new Date() && 
        new Date(t.date).getFullYear() === new Date().getFullYear()
      ).map(t => t.receivedFrom)).size,
      totalAmount: sponsorTransactions.reduce((sum, t) => sum + t.amount, 0),
      byType: {},
      byStatus: {},
      byCategory: {},
    };

    sponsorTransactions.forEach(transaction => {
      // By Category
      if (!stats.byCategory[transaction.category]) {
        stats.byCategory[transaction.category] = { count: 0, amount: 0 };
      }
      stats.byCategory[transaction.category].count++;
      stats.byCategory[transaction.category].amount += transaction.amount;

      // By Type (using accountType)
      if (!stats.byType[transaction.accountType]) {
        stats.byType[transaction.accountType] = { count: 0, amount: 0 };
      }
      stats.byType[transaction.accountType].count++;
      stats.byType[transaction.accountType].amount += transaction.amount;

      // By Status
      if (!stats.byStatus[transaction.status]) {
        stats.byStatus[transaction.status] = { count: 0, amount: 0 };
      }
      stats.byStatus[transaction.status].count++;
      stats.byStatus[transaction.status].amount += transaction.amount;
    });

    setStats(stats);
  };

  const exportToExcel = () => {
    const reportData = [
      ['Sponsorship Report', ''],
      ['Date Range:', `${date.from?.toLocaleDateString() || 'N/A'} - ${date.to?.toLocaleDateString() || 'N/A'}`],
      [''],
      ['Summary'],
      ['Total Sponsors:', stats.totalSponsors],
      ['Active Sponsors:', stats.activeSponsors],
      ['Total Sponsorship Amount:', `LKR ${stats.totalAmount.toLocaleString()}`],
      [''],
      ['By Category'],
      ['Category', 'Count', 'Total Amount'],
      ...Object.entries(stats.byCategory).map(([category, data]) => [
        category,
        data.count,
        `LKR ${data.amount.toLocaleString()}`
      ]),
      [''],
      ['By Account Type'],
      ['Type', 'Count', 'Total Amount'],
      ...Object.entries(stats.byType).map(([type, data]) => [
        type,
        data.count,
        `LKR ${data.amount.toLocaleString()}`
      ]),
      [''],
      ['Detailed Transaction List'],
      ['Date', 'Sponsor', 'Category', 'Account Type', 'Amount', 'Description'],
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.receivedFrom,
        t.category,
        t.accountType,
        `LKR ${t.amount.toLocaleString()}`,
        t.description,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sponsorship Report');
    
    const colWidths = reportData.reduce((widths: any, row) => {
      row.forEach((cell, i) => {
        const cellWidth = (cell?.toString() || '').length;
        widths[i] = Math.max(widths[i] || 0, cellWidth);
      });
      return widths;
    }, {});
    
    ws['!cols'] = Object.values(colWidths).map((width: any) => ({ wch: width }));

    XLSX.writeFile(wb, `Sponsorship_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sponsorship Report</h1>
        <div className="flex items-center gap-4">
          <DateRangePicker
            date={date}
            onDateChange={(newDate: DateRange | undefined) => {
              setDate(newDate || { from: undefined, to: undefined });
            }}
          />
          <Button onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Sponsors</h3>
          <p className="text-2xl font-bold">{stats.totalSponsors}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Active Sponsors</h3>
          <p className="text-2xl font-bold">{stats.activeSponsors}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Sponsorship</h3>
          <p className="text-2xl font-bold">LKR {stats.totalAmount.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Average per Sponsor</h3>
          <p className="text-2xl font-bold">
            LKR {stats.totalSponsors ? Math.round(stats.totalAmount / stats.totalSponsors).toLocaleString() : 0}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sponsorship by Category</h2>
          <div className="space-y-4">
            {Object.entries(stats.byCategory).map(([category, data]) => (
              <div key={category} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{category}</p>
                  <p className="text-sm text-muted-foreground">{data.count} transactions</p>
                </div>
                <p className="font-medium">LKR {data.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sponsorship by Account Type</h2>
          <div className="space-y-4">
            {Object.entries(stats.byType).map(([type, data]) => (
              <div key={type} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{type}</p>
                  <p className="text-sm text-muted-foreground">{data.count} transactions</p>
                </div>
                <p className="font-medium">LKR {data.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sponsorship Transactions</h2>
        <div className="space-y-4">
          {transactions.map(transaction => (
            <Card key={transaction.id} className="p-4 border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{transaction.receivedFrom}</h3>
                  <p className="text-muted-foreground">{transaction.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    LKR {transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{transaction.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-medium">{transaction.accountType}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
} 