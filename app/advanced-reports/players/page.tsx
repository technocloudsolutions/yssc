'use client';

import { ReportContainer } from "@/components/reports/ReportContainer";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, FirestoreError, setDoc } from "firebase/firestore";
import { formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { BarChart, PieChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface PlayerFinancial {
  income: {
    salary: number;
    bonuses: number;
    sponsorships: number;
    other: number;
  };
  expenses: {
    training: number;
    medical: number;
    equipment: number;
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
      category: 'salary' | 'bonus' | 'transfer' | 'expense' | 'other';
      status: 'completed' | 'pending' | 'failed';
      reference: string;
    }[];
    balance: number;
    lastUpdated: string;
  };
}

interface Player {
  id: string;
  name: string;
  position: string;
  status: string;
  contractValue: number;
  performance: number;
  joinedDate: string;
  nationality: string;
  age: number;
  financial?: PlayerFinancial;
}

interface PlayerFinancialDetailsProps {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlayerFinancialDetails({ player, open, onOpenChange }: PlayerFinancialDetailsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{player.name} - Financial Details</DialogTitle>
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
                    (player.financial?.income.salary || 0) +
                    (player.financial?.income.bonuses || 0) +
                    (player.financial?.income.sponsorships || 0) +
                    (player.financial?.income.other || 0)
                  )}
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatAmount(
                    (player.financial?.expenses.training || 0) +
                    (player.financial?.expenses.medical || 0) +
                    (player.financial?.expenses.equipment || 0) +
                    (player.financial?.expenses.other || 0)
                  )}
                </p>
              </Card>
              <Card className="p-4 col-span-2">
                <h3 className="text-lg font-semibold mb-2">Bank Balance</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatAmount(player.financial?.bankDetails?.balance || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {player.financial?.bankDetails?.lastUpdated 
                    ? new Date(player.financial.bankDetails.lastUpdated).toLocaleString()
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
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.income.salary || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Bonuses</h4>
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.income.bonuses || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Sponsorships</h4>
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.income.sponsorships || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Other Income</h4>
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.income.other || 0)}</p>
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
                    <h4 className="font-medium text-muted-foreground">Training</h4>
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.expenses.training || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Medical</h4>
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.expenses.medical || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Equipment</h4>
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.expenses.equipment || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Other Expenses</h4>
                    <p className="text-xl font-semibold">{formatAmount(player.financial?.expenses.other || 0)}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transfers">
            <div className="space-y-4">
              {player.financial?.transfers.map((transfer, index) => (
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
                    <p className="text-lg font-semibold">{player.financial?.bankDetails?.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Account Number</h4>
                    <p className="text-lg font-semibold">
                      {player.financial?.bankDetails?.accountNumber 
                        ? '****' + player.financial.bankDetails.accountNumber.slice(-4)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Recent Transactions</h4>
                  <div className="space-y-3">
                    {player.financial?.bankDetails?.transactions.slice(0, 5).map((transaction, index) => (
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
                  {player.financial?.bankDetails?.transactions.length === 0 && (
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

export default function PlayerAnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);
        }
      } catch (error) {
        if (error instanceof FirestoreError) {
          setError(`Failed to fetch user role: ${error.message}`);
          toast({
            title: "Error",
            description: `Failed to fetch user role: ${error.message}`,
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, toast]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playersRef = collection(db, 'players');
        const snapshot = await getDocs(playersRef);
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          performance: doc.data().performance || 0
        })) as Player[];
        setPlayers(playersData);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "Error",
          description: "Failed to fetch players data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [toast]);

  const handleViewFinancials = async (player: Player) => {
    try {
      setShowFinancialDetails(true);
      
      // Get all financial data for this player
      const financeRef = collection(db, 'finance');
      const q = query(financeRef, where('playerId', '==', player.id));
      const snapshot = await getDocs(q);

      let financialData: PlayerFinancial = {
        income: { salary: 0, bonuses: 0, sponsorships: 0, other: 0 },
        expenses: { training: 0, medical: 0, equipment: 0, other: 0 },
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
        const type = data.type; // 'income', 'expense', 'transfer', 'bank'
        const amount = data.amount || 0;
        const category = data.category;
        const date = data.date;

        switch (type) {
          case 'income':
            if (category === 'salary') financialData.income.salary += amount;
            else if (category === 'bonus') financialData.income.bonuses += amount;
            else if (category === 'sponsorship') financialData.income.sponsorships += amount;
            else financialData.income.other += amount;
            break;
          case 'expense':
            if (category === 'training') financialData.expenses.training += amount;
            else if (category === 'medical') financialData.expenses.medical += amount;
            else if (category === 'equipment') financialData.expenses.equipment += amount;
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

      setSelectedPlayer({ ...player, financial: financialData });
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

  const metrics = [
    {
      label: 'Total Players',
      value: players.length,
      change: 5,
      trend: 'up' as const
    },
    {
      label: 'Active Players',
      value: players.filter(p => p.status === 'Active').length,
      change: 0,
      trend: 'neutral' as const
    },
    {
      label: 'Average Performance',
      value: players.length > 0
        ? (players.reduce((sum, p) => sum + (p.performance || 0), 0) / players.length).toFixed(1)
        : '0.0',
      change: 2.5,
      trend: 'up' as const
    },
    {
      label: 'Total Contract Value',
      value: formatAmount(players.reduce((sum, p) => sum + (p.contractValue || 0), 0)),
      change: -1.2,
      trend: 'down' as const
    }
  ];

  const positionData = {
    labels: Array.from(new Set(players.map(p => p.position))),
    datasets: [
      {
        label: 'Players by Position',
        data: Array.from(
          players.reduce((acc, player) => {
            acc.set(player.position, (acc.get(player.position) || 0) + 1);
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

  const performanceData = {
    labels: players.map(p => p.name),
    datasets: [
      {
        label: 'Performance Rating',
        data: players.map(p => p.performance || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const ageDistribution = {
    labels: ['Under 20', '20-25', '26-30', 'Over 30'],
    datasets: [
      {
        label: 'Age Distribution',
        data: [
          players.filter(p => p.age < 20).length,
          players.filter(p => p.age >= 20 && p.age <= 25).length,
          players.filter(p => p.age > 25 && p.age <= 30).length,
          players.filter(p => p.age > 30).length,
        ],
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
    { key: 'position', label: 'Position', sortable: true },
    { key: 'age', label: 'Age', sortable: true },
    { key: 'nationality', label: 'Nationality', sortable: true },
    { 
      key: 'performance', 
      label: 'Performance', 
      sortable: true,
      render: (player: Player) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            (player.performance || 0) >= 8 ? 'bg-green-500' :
            (player.performance || 0) >= 6 ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          {(player.performance || 0).toFixed(1)}
        </div>
      )
    },
    { 
      key: 'contractValue', 
      label: 'Contract Value', 
      sortable: true,
      render: (player: Player) => formatAmount(player.contractValue || 0)
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (player: Player) => (
        <div className={`px-2 py-1 rounded-full text-xs ${
          player.status === 'Active' ? 'bg-green-100 text-green-800' :
          player.status === 'Injured' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {player.status}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (player: Player) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewFinancials(player)}
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

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-lg font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-sm text-red-500">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              window.location.reload();
            }} 
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ReportContainer
        title="Player Analytics"
        description="Comprehensive analysis of player statistics, performance metrics, and financial data"
        metrics={metrics}
        barChartData={performanceData}
        pieChartData={positionData}
        lineChartData={undefined}
        tableColumns={columns}
        tableData={players}
      />
      {selectedPlayer && (
        <PlayerFinancialDetails 
          player={selectedPlayer}
          open={showFinancialDetails}
          onOpenChange={setShowFinancialDetails}
        />
      )}
    </>
  );
} 