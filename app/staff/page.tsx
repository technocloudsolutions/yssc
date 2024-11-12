'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, Users, UserCircle, Briefcase, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  position: string;
  department: string;
  joinDate: string;
  nicNumber: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  profilePicture?: string;
}

const STATUS_OPTIONS = ['Active', 'On Leave', 'Inactive'] as const;

const columns = [
  {
    key: 'profilePicture',
    label: '',
    sortable: false,
    render: (staff: StaffMember) => (
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
        {staff.profilePicture ? (
          <img 
            src={staff.profilePicture} 
            alt={staff.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-avatar.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Users className="h-5 w-5" />
          </div>
        )}
      </div>
    )
  },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { key: 'joinDate', label: 'Join Date', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

// Add this validation function before the StaffPage component
const validateFormData = (data: Omit<StaffMember, 'id'>) => {
  // Personal Information validation
  if (!data.name || !data.email || !data.phone || 
      !data.address || !data.city || !data.state || !data.postalCode) {
    return { isValid: false, tab: 'personal', message: 'Please fill all personal information fields' };
  }

  // Professional Information validation
  if (!data.position || !data.department || !data.joinDate || !data.status) {
    return { isValid: false, tab: 'professional', message: 'Please fill all professional information fields' };
  }

  // Additional Information validation
  if (!data.nicNumber) {
    return { isValid: false, tab: 'additional', message: 'Please fill all additional information fields' };
  }

  return { isValid: true, tab: null, message: '' };
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Omit<StaffMember, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    position: '',
    department: '',
    joinDate: '',
    nicNumber: '',
    status: 'Active',
    profilePicture: ''
  });

  const [activeTab, setActiveTab] = useState('personal');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'departments'));
      const deptNames = querySnapshot.docs.map(doc => doc.data().name);
      setDepartments(deptNames);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const staffRef = collection(db, 'staff');
      const snapshot = await getDocs(staffRef);
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = validateFormData(formData);
    if (!validation.isValid) {
      setFormError(validation.message);
      setActiveTab(validation.tab);
      return;
    }

    try {
      if (editingStaff) {
        const staffRef = doc(db, 'staff', editingStaff.id);
        await updateDoc(staffRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'staff'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      
      setIsModalOpen(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      setFormError('Failed to save staff data. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteDoc(doc(db, 'staff', id));
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      position: '',
      department: '',
      joinDate: '',
      nicNumber: '',
      status: 'Active',
      profilePicture: ''
    });
  };

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      city: staff.city,
      state: staff.state,
      postalCode: staff.postalCode,
      position: staff.position,
      department: staff.department,
      joinDate: staff.joinDate,
      nicNumber: staff.nicNumber,
      status: staff.status,
      profilePicture: staff.profilePicture
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `staff/${file.name}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData({ ...formData, profilePicture: url });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Staff Member</Button>
      </div>

      <DataTable
        title="Staff Members"
        columns={columns}
        data={staff}
        onEdit={handleEdit}
        onDelete={handleDelete}
        renderCustomCell={(column, item) => {
          if (column.key === 'profilePicture' && column.render) {
            return column.render(item);
          }
          return item[column.key];
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
          resetForm();
        }}
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4">
              {formError}
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professional
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                    {formData.profilePicture ? (
                      <img 
                        src={formData.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profilePicture"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('profilePicture')?.click()}
                      disabled={uploading}
                      className="w-[120px]"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Choose Photo'
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter street address"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State/Region</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="Postal code"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            {/* Professional Information Tab */}
            <TabsContent value="professional" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Enter position"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Join Date</label>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffMember['status'] })}
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </TabsContent>

            {/* Additional Information Tab */}
            <TabsContent value="additional" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">NIC Number</label>
                <Input
                  value={formData.nicNumber}
                  onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                  placeholder="Enter NIC number"
                  required
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-3 pt-4">
            <div className="text-sm text-muted-foreground">
              {activeTab === 'personal' ? (
                'Fill personal details, then proceed to Professional tab'
              ) : activeTab === 'professional' ? (
                'Fill professional details, then proceed to Additional tab'
              ) : (
                'Fill additional details to complete the form'
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingStaff(null);
                  resetForm();
                  setFormError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingStaff ? 'Update' : 'Add'} Staff Member
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
} 