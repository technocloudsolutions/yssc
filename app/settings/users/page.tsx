'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { UserData, NewUser } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLES = ['admin', 'user', 'staff'] as const;

export default function UsersPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    role: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'active'
      });

      toast({
        title: "Success",
        description: "User has been created successfully.",
      });
      setIsAddingUser(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: '',
        status: 'active'
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      const userRef = doc(db, 'users', user.id);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await updateDoc(userRef, { status: newStatus });
      toast({
        description: `User status changed to ${newStatus}`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({
        description: "User has been deleted successfully.",
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  if (!userData || userData.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-black/5 min-h-screen">
      <div className="flex justify-between items-center bg-yellow-500/90 p-4 rounded-lg shadow-lg transition-all hover:shadow-xl">
        <h1 className="text-2xl font-bold text-black">User Management</h1>
        <Button 
          onClick={() => setIsAddingUser(true)}
          className="bg-black hover:bg-black/80 text-yellow-400 transition-colors duration-200"
        >
          Add User
        </Button>
      </div>

      {isAddingUser && (
        <Card className="p-6 border-2 border-yellow-500 shadow-xl bg-black/5 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 font-semibold">Name</label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
                className="border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                className="border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold">Password</label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                className="border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold">Role</label>
              <select
                className="w-full p-2 border-2 border-yellow-500 rounded-md 
                focus:ring-yellow-500 focus:border-yellow-500 
                bg-black text-yellow-400 cursor-pointer
                hover:bg-black/90"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                required
              >
                <option value="" className="bg-black text-yellow-400">Select Role</option>
                {ROLES.map((role) => (
                  <option 
                    key={role} 
                    value={role} 
                    className="bg-black text-yellow-400"
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 text-black transition-colors duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingUser(false)}
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-2 border-yellow-500 shadow-xl overflow-hidden transition-all hover:shadow-2xl bg-white dark:bg-black">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-yellow-500 hover:bg-yellow-500">
                <TableHead className="text-black font-bold dark:text-black">Name</TableHead>
                <TableHead className="text-black font-bold dark:text-black">Email</TableHead>
                <TableHead className="text-black font-bold dark:text-black">Role</TableHead>
                <TableHead className="text-black font-bold dark:text-black">Status</TableHead>
                <TableHead className="text-black font-bold dark:text-black">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="bg-white dark:bg-black hover:bg-yellow-50 dark:hover:bg-yellow-950 
                      border-b border-yellow-200 dark:border-yellow-900"
                  >
                    <TableCell className="font-medium text-black dark:text-white">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-black dark:text-white">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full text-sm font-medium
                        bg-yellow-500 text-black dark:bg-yellow-500 dark:text-black
                        border border-yellow-600">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        className={`
                          transition-all duration-200 font-medium
                          ${user.status === 'active' 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-gray-500 hover:bg-gray-600 text-white'}
                        `}
                      >
                        {user.status}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-500 hover:bg-red-600 transition-colors duration-200 text-white"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
} 