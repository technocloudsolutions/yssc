'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { DepartmentForm } from '@/components/forms/department-form';
import { RoleForm } from '@/components/forms/role-form';
import { AccountTypeForm } from '@/components/forms/account-type-form';
import { CategoryForm } from '@/components/forms/category-form';
import { useDataOperations, Collection } from '@/hooks/useDataOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { initializeSettings } from '@/lib/initializeSettings';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Users, Wallet, FolderTree, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  department: string;
  description?: string;
}

interface AccountType {
  id: string;
  name: string;
  description?: string;
  type: 'Income' | 'Expense';
  status: 'Active' | 'Inactive';
}

interface Category {
  id: string;
  name: string;
  type: 'Income' | 'Expense';
  description?: string;
  parentId?: string;
  status: 'Active' | 'Inactive';
}

const departmentColumns = [
  { key: 'name', label: 'Department Name', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
];

const roleColumns = [
  { key: 'name', label: 'Role Name', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
];

const accountTypeColumns = [
  { key: 'name', label: 'Account Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const categoryColumns = [
  { key: 'name', label: 'Category Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const mockCategories: Category[] = [
  // Income Categories
  { id: '1', name: 'Match Revenue', type: 'Income', status: 'Active' },
  { id: '2', name: 'Sponsorship', type: 'Income', status: 'Active' },
  { id: '3', name: 'Merchandise Sales', type: 'Income', status: 'Active' },
  { id: '4', name: 'Ticket Sales', type: 'Income', status: 'Active' },
  { id: '5', name: 'Broadcasting Rights', type: 'Income', status: 'Active' },
  { id: '6', name: 'Player Transfer Fees', type: 'Income', status: 'Active' },
  
  // Expense Categories
  { id: '7', name: 'Player Salaries', type: 'Expense', status: 'Active' },
  { id: '8', name: 'Staff Salaries', type: 'Expense', status: 'Active' },
  { id: '9', name: 'Equipment', type: 'Expense', status: 'Active' },
  { id: '10', name: 'Travel Expenses', type: 'Expense', status: 'Active' },
  { id: '11', name: 'Facility Maintenance', type: 'Expense', status: 'Active' },
  { id: '12', name: 'Medical Expenses', type: 'Expense', status: 'Active' },
  { id: '13', name: 'Training Facilities', type: 'Expense', status: 'Active' },
  { id: '14', name: 'Marketing', type: 'Expense', status: 'Active' },
  { id: '15', name: 'Insurance', type: 'Expense', status: 'Active' },
  { id: '16', name: 'Utilities', type: 'Expense', status: 'Active' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingAccountType, setEditingAccountType] = useState<AccountType | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { 
    items: departments, 
    addItem: addDepartment, 
    updateItem: updateDepartment, 
    deleteItem: deleteDepartment,
    refreshItems: fetchDepartments
  } = useDataOperations('departments' as Collection);

  const { 
    items: roles, 
    addItem: addRole,
    updateItem: updateRole, 
    deleteItem: deleteRole,
    refreshItems: fetchRoles
  } = useDataOperations('roles' as Collection);

  const { 
    items: accountTypes, 
    addItem: addAccountType, 
    updateItem: updateAccountType, 
    deleteItem: deleteAccountType,
    refreshItems: fetchAccountTypes
  } = useDataOperations('accountTypes' as Collection);

  const { 
    items: categories, 
    addItem: addCategory, 
    updateItem: updateCategory, 
    deleteItem: deleteCategory,
    refreshItems: fetchCategories
  } = useDataOperations('categories' as Collection);

  const handleAddDepartment = async (data: any) => {
    try {
      await addDepartment(data);
      setIsDepartmentModalOpen(false);
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  const handleEditDepartment = async (data: any) => {
    if (editingDepartment) {
      try {
        await updateDepartment(editingDepartment.id, data);
        setEditingDepartment(null);
        setIsDepartmentModalOpen(false);
      } catch (error) {
        console.error('Error updating department:', error);
      }
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  const handleAddRole = async (data: any) => {
    try {
      await addRole(data);
      setIsRoleModalOpen(false);
    } catch (error) {
      console.error('Error adding role:', error);
    }
  };

  const handleEditRole = async (data: any) => {
    if (editingRole) {
      try {
        await updateRole(editingRole.id, data);
        setEditingRole(null);
        setIsRoleModalOpen(false);
      } catch (error) {
        console.error('Error updating role:', error);
      }
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRole(id);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const handleAddAccountType = async (data: any) => {
    try {
      await addAccountType({ ...data, status: 'Active' });
      setIsAccountTypeModalOpen(false);
    } catch (error) {
      console.error('Error adding account type:', error);
    }
  };

  const handleEditAccountType = async (data: any) => {
    if (editingAccountType) {
      try {
        await updateAccountType(editingAccountType.id, data);
        setEditingAccountType(null);
        setIsAccountTypeModalOpen(false);
      } catch (error) {
        console.error('Error updating account type:', error);
      }
    }
  };

  const handleDeleteAccountType = async (id: string) => {
    if (confirm('Are you sure you want to delete this account type?')) {
      try {
        await deleteAccountType(id);
      } catch (error) {
        console.error('Error deleting account type:', error);
      }
    }
  };

  const handleAddCategory = async (data: any) => {
    try {
      await addCategory({ ...data, status: 'Active' });
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEditCategory = async (data: any) => {
    if (editingCategory) {
      try {
        await updateCategory(editingCategory.id, data);
        setEditingCategory(null);
        setIsCategoryModalOpen(false);
      } catch (error) {
        console.error('Error updating category:', error);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleInitialize = async () => {
    try {
      await initializeSettings();
      // Refresh all data after initialization
      fetchDepartments();
      fetchRoles();
      fetchAccountTypes();
      fetchCategories();
      alert('Settings initialized successfully!');
    } catch (error) {
      console.error('Error initializing settings:', error);
      alert('Error initializing settings. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleInitialize}
            variant="outline"
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 border-yellow-600 hover:border-yellow-700 hover:bg-yellow-50 dark:text-yellow-500 dark:hover:text-yellow-400"
          >
            <Settings className="h-4 w-4" />
            Initialize Default Settings
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="departments" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="departments" className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="accountTypes" className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <Wallet className="h-4 w-4" />
            Account Types
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <FolderTree className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Departments Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage club departments and their details
                </p>
              </div>
              <Button 
                onClick={() => setIsDepartmentModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </div>
            <DataTable
              columns={departmentColumns}
              data={departments}
              onEdit={(department) => {
                setEditingDepartment(department);
                setIsDepartmentModalOpen(true);
              }}
              onDelete={handleDeleteDepartment}
            />
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Roles Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage staff roles and permissions
                </p>
              </div>
              <Button 
                onClick={() => setIsRoleModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>
            <DataTable
              columns={roleColumns}
              data={roles}
              onEdit={(role) => {
                setEditingRole(role);
                setIsRoleModalOpen(true);
              }}
              onDelete={handleDeleteRole}
            />
          </Card>
        </TabsContent>

        <TabsContent value="accountTypes">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Account Types Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage financial account types
                </p>
              </div>
              <Button 
                onClick={() => setIsAccountTypeModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account Type
              </Button>
            </div>
            <DataTable
              columns={accountTypeColumns}
              data={accountTypes}
              onEdit={(accountType) => {
                setEditingAccountType(accountType);
                setIsAccountTypeModalOpen(true);
              }}
              onDelete={handleDeleteAccountType}
            />
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Categories Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage transaction categories
                </p>
              </div>
              <Button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
            <DataTable
              columns={categoryColumns}
              data={categories}
              onEdit={(category) => {
                setEditingCategory(category);
                setIsCategoryModalOpen(true);
              }}
              onDelete={handleDeleteCategory}
            />
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        isOpen={isDepartmentModalOpen}
        onClose={() => {
          setIsDepartmentModalOpen(false);
          setEditingDepartment(null);
        }}
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
      >
        <DepartmentForm
          onSubmit={editingDepartment ? handleEditDepartment : handleAddDepartment}
          initialData={editingDepartment}
        />
      </Modal>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
        }}
        title={editingRole ? 'Edit Role' : 'Add New Role'}
      >
        <RoleForm
          onSubmit={editingRole ? handleEditRole : handleAddRole}
          initialData={editingRole}
          departments={departments}
        />
      </Modal>

      <Modal
        isOpen={isAccountTypeModalOpen}
        onClose={() => {
          setIsAccountTypeModalOpen(false);
          setEditingAccountType(null);
        }}
        title={editingAccountType ? 'Edit Account Type' : 'Add New Account Type'}
      >
        <AccountTypeForm
          onSubmit={editingAccountType ? handleEditAccountType : handleAddAccountType}
          initialData={editingAccountType}
        />
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <CategoryForm
          onSubmit={editingCategory ? handleEditCategory : handleAddCategory}
          initialData={editingCategory}
        />
      </Modal>
    </div>
  );
} 