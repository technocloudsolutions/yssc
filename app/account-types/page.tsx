'use client';

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AccountType {
  id: string;
  name: string;
  description: string;
  balance: number;
  status: 'Active' | 'Inactive';
  type: 'Income' | 'Expense';
  createdAt: string;
  transactions: any[];
}

export default function AccountTypesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAccountTypes = async () => {
      try {
        const accountsRef = collection(db, 'accountTypes');
        const snapshot = await getDocs(accountsRef);
        const accounts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AccountType[];
        setAccountTypes(accounts);
      } catch (error) {
        console.error('Error fetching account types:', error);
        toast({
          title: "Error",
          description: "Failed to fetch account types. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAccountTypes();
    }
  }, [user, toast]);

  const filteredAccounts = accountTypes.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = accountTypes.reduce((sum, account) => {
    if (account.type === 'Income') {
      return sum + account.balance;
    } else {
      return sum - account.balance;
    }
  }, 0);

  const activeAccounts = accountTypes.filter(account => account.status === 'Active').length;
  const inactiveAccounts = accountTypes.filter(account => account.status === 'Inactive').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      currencyDisplay: 'code',
    }).format(amount).replace('LKR', 'LKR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Account Types</h1>
          <p className="text-sm text-muted-foreground">Manage your account types and balances</p>
        </div>
        <Button>Add Account Type</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
          <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalBalance)}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Active Accounts</h3>
          <p className="text-2xl font-bold text-blue-600">{activeAccounts}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Inactive Accounts</h3>
          <p className="text-2xl font-bold text-gray-600">{inactiveAccounts}</p>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    account.type === 'Income' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {account.type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={account.type === 'Income' ? "text-blue-600" : "text-amber-600"}>
                    {formatCurrency(account.balance)}
                  </span>
                </TableCell>
                <TableCell>{account.description}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    account.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.status}
                  </span>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 