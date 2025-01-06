'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { FileText, Download, Filter, Calendar, Printer } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";

interface Report {
  id: string;
  title: string;
  category: 'financial' | 'performance' | 'players' | 'staff';
  date: string;
  status: 'Generated' | 'Draft' | 'Archived';
  summary: string;
  data?: any;
  createdAt: string;
}

const REPORT_CATEGORIES = [
  { value: 'financial', label: 'Financial Reports' },
  { value: 'performance', label: 'Performance Reports' },
  { value: 'staff', label: 'Staff Reports' }
] as const;

const formatReportForDownload = (report: Report) => {
  const formattedData = {
    reportInfo: {
      title: report.title,
      category: report.category,
      date: new Date(report.date).toLocaleDateString(),
      status: report.status,
      generatedAt: new Date().toLocaleString()
    },
    summary: report.summary,
    data: report.data
  };

  return JSON.stringify(formattedData, null, 2);
};

const formatDetailedAnalysis = (details: any) => {
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      // Format currency values
      if (value > 1000) {
        return `LKR ${(value).toLocaleString()}`;
      }
      return value.toString();
    }
    return value;
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, ' '); // Replace underscores with spaces
  };

  const renderObject = (obj: any, indent: number = 0): string => {
    let result = '';
    for (const [key, value] of Object.entries(obj)) {
      const indentation = '  '.repeat(indent);
      if (typeof value === 'object' && value !== null) {
        result += `${indentation}${formatKey(key)}:\n`;
        result += renderObject(value, indent + 1);
      } else {
        result += `${indentation}${formatKey(key)}: ${formatValue(value)}\n`;
      }
    }
    return result;
  };

  return renderObject(details);
};

const formatReportForPrint = (report: Report) => {
  return `
    <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            max-width: 1000px;
            margin: 0 auto;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .header h1 {
            font-size: 24px;
            color: #111;
            margin-bottom: 10px;
          }
          .meta-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .meta-info p {
            margin: 5px 0;
          }
          .summary-section {
            margin: 30px 0;
            padding: 20px;
            border-left: 4px solid #333;
            background: #fafafa;
          }
          .data-section {
            margin: 30px 0;
          }
          .data-section h2 {
            color: #111;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .data-item {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
          }
          .data-item h3 {
            font-size: 16px;
            color: #666;
            margin-bottom: 8px;
          }
          .data-item p {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
          }
          .detailed-analysis {
            font-family: monospace;
            white-space: pre-wrap;
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            line-height: 1.6;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.title}</h1>
          <p>Generated on ${new Date(report.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </div>

        <div class="meta-info">
          <p><strong>Category:</strong> ${report.category}</p>
          <p><strong>Status:</strong> ${report.status}</p>
          <p><strong>Report Period:</strong> ${report.data?.period || 'N/A'}</p>
        </div>

        <div class="summary-section">
          <h2>Executive Summary</h2>
          <p>${report.summary}</p>
        </div>

        ${report.data ? `
          <div class="data-section">
            <h2>Detailed Report</h2>
            ${report.data.summary ? `
              <div class="data-grid">
                ${Object.entries(report.data.summary).map(([key, value]) => `
                  <div class="data-item">
                    <h3>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                    <p>${typeof value === 'number' ? value.toLocaleString() : value}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${report.data.details ? `
              <div class="data-section">
                <h2>Detailed Analysis</h2>
                <div class="detailed-analysis">
                  ${formatDetailedAnalysis(report.data.details)}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated by FC Admin System</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
};

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { 
    key: 'date', 
    label: 'Date', 
    sortable: true,
    render: (report: Report) => new Date(report.date).toLocaleDateString()
  },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'summary', label: 'Summary', sortable: false },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    render: (report: Report) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const content = formatReportForPrint(report);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(content);
              printWindow.document.close();
              printWindow.focus();
            }
          }}
          className="flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          View Report
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const content = formatReportForDownload(report);
            const blob = new Blob([content], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${report.title.replace(/\s+/g, '-')}-${report.date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const content = formatReportForPrint(report);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(content);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
              }, 250);
            }
          }}
          className="flex items-center gap-1"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
    )
  }
];

// Helper function to generate financial report data
const generateFinancialReport = async () => {
  const transactionsRef = collection(db, 'transactions');
  const snapshot = await getDocs(transactionsRef);
  const transactions = snapshot.docs.map(doc => doc.data());

  const income = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const expenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return {
    summary: {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      transactionCount: transactions.length
    },
    details: {
      byCategory: transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {}),
      recentTransactions: transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    }
  };
};

// Helper function to generate performance report data
const generatePerformanceReport = async () => {
  const performancesRef = collection(db, 'performances');
  const snapshot = await getDocs(performancesRef);
  const performances = snapshot.docs.map(doc => doc.data());

  return {
    summary: {
      totalPlayers: performances.length,
      averageRating: performances.reduce((sum, p) => sum + (p.rating || 0), 0) / performances.length,
      totalGoals: performances.reduce((sum, p) => sum + (p.goals || 0), 0),
      totalAssists: performances.reduce((sum, p) => sum + (p.assists || 0), 0)
    },
    details: {
      topScorers: performances
        .sort((a, b) => (b.goals || 0) - (a.goals || 0))
        .slice(0, 5),
      topPerformers: performances
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
    }
  };
};

// Helper function to generate staff report data
const generateStaffReport = async () => {
  const staffRef = collection(db, 'staff');
  const snapshot = await getDocs(staffRef);
  const staff = snapshot.docs.map(doc => doc.data());

  return {
    summary: {
      totalStaff: staff.length,
      byDepartment: staff.reduce((acc, s) => {
        acc[s.department] = (acc[s.department] || 0) + 1;
        return acc;
      }, {}),
      activeStaff: staff.filter(s => s.status === 'Active').length
    },
    details: {
      staff: staff.map(s => ({
        name: s.name,
        position: s.position,
        department: s.department,
        status: s.status
      }))
    }
  };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    summary: '',
    status: 'Generated' as const
  });
  const defaultDateRange = {
    from: addDays(new Date(), -30),
    to: new Date(),
  };
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const reportsRef = collection(db, 'reports');
      const snapshot = await getDocs(reportsRef);
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let reportData;
      switch (formData.category) {
        case 'financial':
          reportData = await generateFinancialReport();
          break;
        case 'performance':
          reportData = await generatePerformanceReport();
          break;
        case 'staff':
          reportData = await generateStaffReport();
          break;
        default:
          throw new Error('Invalid report category');
      }

      const report = {
        ...formData,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        data: reportData
      };

      await addDoc(collection(db, 'reports'), report);
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: '',
        summary: '',
        status: 'Generated'
      });
      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getFilteredReports = () => {
    if (!dateRange.from) return reports;
    
    return reports.filter(report => {
      const reportDate = new Date(report.date);
      const from = dateRange.from;
      const to = dateRange.to || dateRange.from;
      
      // Add null checks and ensure dates are valid
      if (!from || !to || !reportDate) return true;
      
      // Convert all to timestamps for comparison
      const reportTimestamp = reportDate.getTime();
      const fromTimestamp = from.getTime();
      const toTimestamp = to.getTime();
      
      return reportTimestamp >= fromTimestamp && reportTimestamp <= toTimestamp;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button onClick={() => setIsModalOpen(true)}>Generate Report</Button>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="flex-1">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={(newDate) => newDate && setDateRange(newDate)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setDateRange(defaultDateRange)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Clear Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {REPORT_CATEGORIES.map((category) => (
          <Card key={category.value} className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.label}
                </p>
                <h3 className="text-2xl font-bold">
                  {reports.filter(r => r.category === category.value).length}
                </h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={getFilteredReports()}
        renderCustomCell={(column, item) => {
          if (column.render) {
            return column.render(item);
          }
          return item[column.key];
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate New Report"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Report Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Category</label>
            <select
              className="w-full p-2 border rounded-md bg-background"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {REPORT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Summary</label>
            <textarea
              className="w-full p-2 border rounded-md bg-background min-h-[100px]"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit">Generate Report</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 