'use client';

import { ReportContainer } from "@/components/reports/ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface StaffFinancial {
  income: {
    salary: number;
    bonuses: number;
    allowances: number;
    other: number;
  };
  expenses: {
    travel: number;
    equipment: number;
    training: number;
    other: number;
  };
  transfers: {
    date: string;
    amount: number;
    type: 'in' | 'out';
    description: string;
  }[];
  bankDetails: {
    accountNumber: string;
    bankName: string;
    transactions: {
      date: string;
      amount: number;
      type: 'credit' | 'debit';
      description: string;
      category: 'salary' | 'bonus' | 'allowance' | 'expense' | 'other';
      status: 'completed' | 'pending' | 'failed';
      reference: string;
    }[];
    balance: number;
    lastUpdated: string;
  };
}

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  salary: number;
  joinedDate: string;
  email: string;
  phone: string;
  performance: number;
  experience: number;
  financial?: StaffFinancial;
}

interface StaffFinancialDetailsProps {
  staff: Staff;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StaffFinancialDetails({ staff, open, onOpenChange }: StaffFinancialDetailsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{staff.name} - Financial Details</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Total Income</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(
                    (staff.financial?.income.salary || 0) +
                    (staff.financial?.income.bonuses || 0) +
                    (staff.financial?.income.allowances || 0) +
                    (staff.financial?.income.other || 0)
                  )}
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatAmount(
                    (staff.financial?.expenses.travel || 0) +
                    (staff.financial?.expenses.equipment || 0) +
                    (staff.financial?.expenses.training || 0) +
                    (staff.financial?.expenses.other || 0)
                  )}
                </p>
              </Card>
              <Card className="p-4 col-span-2">
                <h3 className="text-lg font-semibold mb-2">Bank Balance</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatAmount(staff.financial?.bankDetails?.balance || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {staff.financial?.bankDetails?.lastUpdated 
                    ? new Date(staff.financial.bankDetails.lastUpdated).toLocaleString()
                    : 'N/A'}
                </p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="income">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Salary</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.income.salary || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Bonuses</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.income.bonuses || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Allowances</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.income.allowances || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Other Income</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.income.other || 0)}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Travel</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.expenses.travel || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Equipment</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.expenses.equipment || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Training</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.expenses.training || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Other Expenses</h4>
                    <p className="text-xl font-semibold">{formatAmount(staff.financial?.expenses.other || 0)}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transfers">
            <div className="space-y-4">
              {staff.financial?.transfers.map((transfer, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{transfer.description}</p>
                      <p className="text-sm text-muted-foreground">{new Date(transfer.date).toLocaleDateString()}</p>
                    </div>
                    <p className={`text-lg font-semibold ${transfer.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {transfer.type === 'in' ? '+' : '-'}{formatAmount(transfer.amount)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bank">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Bank Name</h4>
                    <p className="text-lg font-semibold">{staff.financial?.bankDetails?.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Account Number</h4>
                    <p className="text-lg font-semibold">
                      {staff.financial?.bankDetails?.accountNumber 
                        ? '****' + staff.financial.bankDetails.accountNumber.slice(-4)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Recent Transactions</h4>
                  <div className="space-y-3">
                    {staff.financial?.bankDetails?.transactions.slice(0, 5).map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                            <span>•</span>
                            <span className="uppercase text-xs">{transaction.category}</span>
                          </div>
                        </div>
                        <p className={`text-lg font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {staff.financial?.bankDetails?.transactions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No transactions found</p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffReportsPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffRef = collection(db, 'staff');
        const snapshot = await getDocs(staffRef);
        const staffData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        setStaff(staffData);
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error",
          description: "Failed to fetch staff data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [toast]);

  const handleViewFinancials = async (staffMember: Staff) => {
    try {
      setShowFinancialDetails(true);
      
      // Get all financial data for this staff member
      const financeRef = collection(db, 'finance');
      const q = query(financeRef, where('staffId', '==', staffMember.id));
      const snapshot = await getDocs(q);

      let financialData: StaffFinancial = {
        income: { salary: 0, bonuses: 0, allowances: 0, other: 0 },
        expenses: { travel: 0, equipment: 0, training: 0, other: 0 },
        transfers: [],
        bankDetails: {
          accountNumber: '',
          bankName: '',
          transactions: [],
          balance: 0,
          lastUpdated: new Date().toISOString()
        }
      };

      // Process all finance records
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const type = data.type;
        const amount = data.amount || 0;
        const category = data.category;
        const date = data.date;

        switch (type) {
          case 'income':
            if (category === 'salary') financialData.income.salary += amount;
            else if (category === 'bonus') financialData.income.bonuses += amount;
            else if (category === 'allowance') financialData.income.allowances += amount;
            else financialData.income.other += amount;
            break;
          case 'expense':
            if (category === 'travel') financialData.expenses.travel += amount;
            else if (category === 'equipment') financialData.expenses.equipment += amount;
            else if (category === 'training') financialData.expenses.training += amount;
            else financialData.expenses.other += amount;
            break;
          case 'transfer':
            financialData.transfers.push({
              date,
              amount,
              type: data.direction === 'in' ? 'in' : 'out',
              description: data.description || ''
            });
            break;
          case 'bank':
            if (!financialData.bankDetails.bankName) {
              financialData.bankDetails.bankName = data.bankName || '';
              financialData.bankDetails.accountNumber = data.accountNumber || '';
            }
            financialData.bankDetails.transactions.push({
              date,
              amount,
              type: data.direction === 'in' ? 'credit' : 'debit',
              description: data.description || '',
              category: data.category || 'other',
              status: data.status || 'completed',
              reference: data.reference || `TXN${Date.now()}`
            });
            break;
        }
      });

      // Calculate bank balance
      financialData.bankDetails.balance = financialData.bankDetails.transactions.reduce((sum, tx) => {
        return sum + (tx.type === 'credit' ? tx.amount : -tx.amount);
      }, 0);

      // Sort transactions by date
      financialData.bankDetails.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setSelectedStaff({ ...staffMember, financial: financialData });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load financial details. Please try again.",
        variant: "destructive",
      });
      setShowFinancialDetails(false);
    }
  };

  // Performance Distribution Chart
  const performanceData = {
    labels: staff.map(s => s.name),
    datasets: [
      {
        label: 'Performance Rating',
        data: staff.map(s => s.performance || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  // Experience Distribution Chart
  const experienceData = {
    labels: ['0-2 years', '3-5 years', '6-10 years', '10+ years'],
    datasets: [
      {
        label: 'Years of Experience',
        data: [
          staff.filter(s => (s.experience || 0) <= 2).length,
          staff.filter(s => (s.experience || 0) > 2 && (s.experience || 0) <= 5).length,
          staff.filter(s => (s.experience || 0) > 5 && (s.experience || 0) <= 10).length,
          staff.filter(s => (s.experience || 0) > 10).length,
        ],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const metrics = [
    {
      label: 'Total Staff',
      value: staff.length,
      change: 2,
      trend: 'up' as const
    },
    {
      label: 'Active Staff',
      value: staff.filter(s => s.status === 'Active').length,
      change: 0,
      trend: 'neutral' as const
    },
    {
      label: 'Average Performance',
      value: staff.length > 0
        ? (staff.reduce((sum, s) => sum + (s.performance || 0), 0) / staff.length).toFixed(1)
        : '0.0',
      change: 1.5,
      trend: 'up' as const
    },
    {
      label: 'Total Salary',
      value: formatAmount(staff.reduce((sum, s) => sum + (s.salary || 0), 0)),
      change: 5,
      trend: 'up' as const
    }
  ];

  const departmentData = {
    labels: Array.from(new Set(staff.map(s => s.department))),
    datasets: [
      {
        label: 'Staff by Department',
        data: Array.from(
          staff.reduce((acc, s) => {
            acc.set(s.department, (acc.get(s.department) || 0) + 1);
            return acc;
          }, new Map<string, number>()),
          ([_, count]) => count
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
      },
    ],
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { 
      key: 'performance', 
      label: 'Performance', 
      sortable: true,
      render: (staff: Staff) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            (staff.performance || 0) >= 8 ? 'bg-green-500' :
            (staff.performance || 0) >= 6 ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          {(staff.performance || 0).toFixed(1)}
        </div>
      )
    },
    { 
      key: 'salary', 
      label: 'Salary', 
      sortable: true,
      render: (staff: Staff) => formatAmount(staff.salary || 0)
    },
    { 
      key: 'experience', 
      label: 'Experience', 
      sortable: true,
      render: (staff: Staff) => `${staff.experience || 0} years`
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (staff: Staff) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          staff.status === 'Active' ? 'bg-green-100 text-green-800' :
          staff.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {staff.status}
        </div>
      )
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (staff: Staff) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewFinancials(staff)}
        >
          View Financials
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <ReportContainer
        title="Staff Reports"
        description="Comprehensive analysis of staff distribution, performance, and financial information"
        metrics={metrics}
        barChartData={performanceData}
        pieChartData={departmentData}
        lineChartData={experienceData}
        tableColumns={columns}
        tableData={staff}
      />
      {selectedStaff && (
        <StaffFinancialDetails 
          staff={selectedStaff}
          open={showFinancialDetails}
          onOpenChange={setShowFinancialDetails}
        />
      )}
    </>
  );
} 