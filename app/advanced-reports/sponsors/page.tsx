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

interface Sponsor {
  id: string;
  name: string;
  sponsorshipType: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  sponsorshipAmount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Pending' | 'Expired' | 'Terminated';
  industry: string;
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
  byIndustry: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  byStatus: {
    [key: string]: number;
  };
}

export default function SponsorsReportPage() {
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [stats, setStats] = useState<SponsorshipStats>({
    totalSponsors: 0,
    activeSponsors: 0,
    totalAmount: 0,
    byType: {},
    byIndustry: {},
    byStatus: {},
  });
  const [date, setDate] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  useEffect(() => {
    fetchSponsors();
  }, [date]);

  const fetchSponsors = async () => {
    try {
      const sponsorsCollection = collection(db, 'sponsors');
      const sponsorsSnapshot = await getDocs(sponsorsCollection);
      const sponsorsList = sponsorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sponsor[];

      setSponsors(sponsorsList);
      calculateStats(sponsorsList);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sponsorsList: Sponsor[]) => {
    const stats: SponsorshipStats = {
      totalSponsors: sponsorsList.length,
      activeSponsors: sponsorsList.filter(s => s.status === 'Active').length,
      totalAmount: sponsorsList.reduce((sum, s) => sum + s.sponsorshipAmount, 0),
      byType: {},
      byIndustry: {},
      byStatus: {},
    };

    sponsorsList.forEach(sponsor => {
      // By Type
      if (!stats.byType[sponsor.sponsorshipType]) {
        stats.byType[sponsor.sponsorshipType] = { count: 0, amount: 0 };
      }
      stats.byType[sponsor.sponsorshipType].count++;
      stats.byType[sponsor.sponsorshipType].amount += sponsor.sponsorshipAmount;

      // By Industry
      if (!stats.byIndustry[sponsor.industry]) {
        stats.byIndustry[sponsor.industry] = { count: 0, amount: 0 };
      }
      stats.byIndustry[sponsor.industry].count++;
      stats.byIndustry[sponsor.industry].amount += sponsor.sponsorshipAmount;

      // By Status
      if (!stats.byStatus[sponsor.status]) {
        stats.byStatus[sponsor.status] = 0;
      }
      stats.byStatus[sponsor.status]++;
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
      ['By Sponsorship Type'],
      ['Type', 'Count', 'Amount'],
      ...Object.entries(stats.byType).map(([type, data]) => [
        type,
        data.count,
        `LKR ${data.amount.toLocaleString()}`,
      ]),
      [''],
      ['By Industry'],
      ['Industry', 'Count', 'Amount'],
      ...Object.entries(stats.byIndustry).map(([industry, data]) => [
        industry || 'Unspecified',
        data.count,
        `LKR ${data.amount.toLocaleString()}`,
      ]),
      [''],
      ['By Status'],
      ['Status', 'Count'],
      ...Object.entries(stats.byStatus).map(([status, count]) => [
        status,
        count,
      ]),
      [''],
      ['Detailed Sponsor List'],
      ['Name', 'Type', 'Amount', 'Status', 'Start Date', 'End Date', 'Industry'],
      ...sponsors.map(sponsor => [
        sponsor.name,
        sponsor.sponsorshipType,
        `LKR ${sponsor.sponsorshipAmount.toLocaleString()}`,
        sponsor.status,
        sponsor.startDate,
        sponsor.endDate,
        sponsor.industry || 'Unspecified',
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
          <h2 className="text-lg font-semibold mb-4">Sponsorship by Type</h2>
          <div className="space-y-4">
            {Object.entries(stats.byType).map(([type, data]) => (
              <div key={type} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{type}</p>
                  <p className="text-sm text-muted-foreground">{data.count} sponsors</p>
                </div>
                <p className="font-medium">LKR {data.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sponsorship by Industry</h2>
          <div className="space-y-4">
            {Object.entries(stats.byIndustry).map(([industry, data]) => (
              <div key={industry} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{industry || 'Unspecified'}</p>
                  <p className="text-sm text-muted-foreground">{data.count} sponsors</p>
                </div>
                <p className="font-medium">LKR {data.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sponsorship Status Distribution</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-muted rounded-lg">
              <p className="font-medium">{status}</p>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round((count / stats.totalSponsors) * 100)}%
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 