'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Building2, Users, Wallet, FolderTree, Settings, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Input } from '@/components/ui/input';

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

interface SponsorshipType {
  id: string;
  name: string;
}

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
  const [isSponsorshipTypeModalOpen, setIsSponsorshipTypeModalOpen] = useState(false);
  const [editingSponsorshipType, setEditingSponsorshipType] = useState<SponsorshipType | null>(null);
  const [sponsorshipTypeFormData, setSponsorshipTypeFormData] = useState({
    name: '',
  });

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

  const { 
    items: sponsorshipTypesList, 
    addItem: addSponsorshipType, 
    updateItem: updateSponsorshipType, 
    deleteItem: deleteSponsorshipType,
    refreshItems: fetchSponsorshipTypes
  } = useDataOperations('sponsorshipTypes' as Collection);

  useEffect(() => {
    // Initial data fetch for all tabs
    fetchDepartments();
    fetchRoles();
    fetchAccountTypes();
    fetchCategories();
    fetchSponsorshipTypes();
  }, []);

  const handleAddSponsorshipType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorshipTypeFormData.name) {
      alert('Please enter sponsorship type name');
      return;
    }

    try {
      if (editingSponsorshipType) {
        await updateSponsorshipType(editingSponsorshipType.id, sponsorshipTypeFormData);
      } else {
        await addSponsorshipType(sponsorshipTypeFormData);
      }
      setIsSponsorshipTypeModalOpen(false);
      resetSponsorshipTypeForm();
    } catch (error) {
      console.error('Error saving sponsorship type:', error);
    }
  };

  const handleDeleteSponsorshipType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sponsorship type?')) return;
    try {
      await deleteSponsorshipType(id);
    } catch (error) {
      console.error('Error deleting sponsorship type:', error);
    }
  };

  const resetSponsorshipTypeForm = () => {
    setSponsorshipTypeFormData({
      name: '',
    });
    setEditingSponsorshipType(null);
  };

  const handleEditSponsorshipType = (type: SponsorshipType) => {
    setEditingSponsorshipType(type);
    setSponsorshipTypeFormData({
      name: type.name,
    });
    setIsSponsorshipTypeModalOpen(true);
  };

  const sponsorshipTypeColumns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row: SponsorshipType) => row.name
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: SponsorshipType) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditSponsorshipType(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteSponsorshipType(row.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

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

  const departmentColumns = [
    { key: 'name', label: 'Department Name', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (department: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingDepartment(department);
              setIsDepartmentModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteDepartment(department.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const roleColumns = [
    { key: 'name', label: 'Role Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (role: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingRole(role);
              setIsRoleModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteRole(role.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const accountTypeColumns = [
    { key: 'name', label: 'Account Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (accountType: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingAccountType(accountType);
              setIsAccountTypeModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteAccountType(accountType.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const categoryColumns = [
    { key: 'name', label: 'Category Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (category: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingCategory(category);
              setIsCategoryModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteCategory(category.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="accountTypes" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Account Types
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="sponsorshipTypes" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Sponsorship Types
          </TabsTrigger>
          <TabsTrigger value="initialize" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Initialize
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

        <TabsContent value="sponsorshipTypes">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Sponsorship Types Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage sponsorship types for sponsors
                </p>
              </div>
              <Button 
                onClick={() => setIsSponsorshipTypeModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </div>
            <DataTable
              columns={sponsorshipTypeColumns}
              data={sponsorshipTypesList}
              onEdit={(type) => {
                setEditingSponsorshipType(type);
                setIsSponsorshipTypeModalOpen(true);
              }}
              onDelete={handleDeleteSponsorshipType}
            />
          </Card>
        </TabsContent>

        <TabsContent value="initialize">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Initialize Default Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Initialize all settings to default values
                </p>
              </div>
              <Button 
                onClick={handleInitialize}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Initialize
              </Button>
            </div>
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

      <Modal
        isOpen={isSponsorshipTypeModalOpen}
        onClose={() => {
          setIsSponsorshipTypeModalOpen(false);
          resetSponsorshipTypeForm();
        }}
        title={editingSponsorshipType ? 'Edit Sponsorship Type' : 'Add Sponsorship Type'}
      >
        <form onSubmit={handleAddSponsorshipType} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={sponsorshipTypeFormData.name}
              onChange={(e) => setSponsorshipTypeFormData({ ...sponsorshipTypeFormData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSponsorshipTypeModalOpen(false);
                resetSponsorshipTypeForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingSponsorshipType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 