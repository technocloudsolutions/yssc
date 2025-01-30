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
import { Loader2, Users, UserCircle, Briefcase, FileText, Printer } from 'lucide-react';
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
  role?: string;
  nic?: string;
}

const STATUS_OPTIONS = ['Active', 'On Leave', 'Inactive'] as const;

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

  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (staff: StaffMember) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleView(staff)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(staff)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(staff.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const validateFormData = (data: Omit<StaffMember, 'id'>) => {
    if (!data.name) {
      return { isValid: false, tab: 'personal', message: 'Please enter the staff member\'s full name' };
    }

    return { isValid: true, tab: 'personal' as const, message: '' };
  };

  interface ViewModalProps {
    staff: StaffMember;
    isOpen: boolean;
    onClose: () => void;
  }

  function ViewStaffModal({ staff, isOpen, onClose }: ViewModalProps) {
    const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Staff Details - ${staff.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                margin: 15px;
                font-size: 12px;
              }
              .header {
                text-align: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ccc;
              }
              .header h1 {
                margin: 5px 0;
                font-size: 20px;
              }
              .header p {
                margin: 5px 0;
                color: #666;
              }
              .staff-image {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                margin: 0 auto;
                display: block;
                object-fit: cover;
                margin-bottom: 10px;
              }
              .section {
                margin-bottom: 15px;
              }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                padding-bottom: 3px;
                border-bottom: 1px solid #eee;
                color: #333;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
              }
              .info-item {
                margin-bottom: 5px;
              }
              .info-label {
                font-weight: bold;
                color: #666;
                font-size: 11px;
                margin-bottom: 2px;
              }
              .info-value {
                color: #333;
              }
              @media print {
                body {
                  margin: 10px;
                  padding: 0;
                }
                .section {
                  page-break-inside: avoid;
                }
                @page {
                  margin: 0.5cm;
                  size: A4;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img 
                src="${staff.profilePicture || '/placeholder-avatar.png'}" 
                alt="${staff.name}"
                class="staff-image"
              />
              <h1>${staff.name}</h1>
              <p>${staff.position}</p>
            </div>

            <div class="section">
              <h2 class="section-title">Personal Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${staff.email || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${staff.phone || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Address</div>
                  <div class="info-value">${staff.address || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">NIC</div>
                  <div class="info-value">${staff.nicNumber || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Employment Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Role</div>
                  <div class="info-value">${staff.position}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Department</div>
                  <div class="info-value">${staff.department}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Join Date</div>
                  <div class="info-value">${staff.joinDate || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">${staff.status}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Staff Details">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {staff.profilePicture ? (
                <img 
                  src={staff.profilePicture} 
                  alt={staff.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Users className="h-8 w-8" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{staff.name}</h2>
              <p className="text-muted-foreground">{staff.position}</p>
            </div>
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card className="p-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                    <dd>{staff.email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                    <dd>{staff.phone || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                    <dd>{staff.address || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">NIC</dt>
                    <dd>{staff.nicNumber || 'N/A'}</dd>
                  </div>
                </dl>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <Card className="p-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                    <dd>{staff.position}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                    <dd>{staff.department}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Join Date</dt>
                    <dd>{staff.joinDate || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd>{staff.status}</dd>
                  </div>
                </dl>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>
    );
  }

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

  const handleView = (staff: StaffMember) => {
    setViewingStaff(staff);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Member Management</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Staff Member</Button>
      </div>

      <DataTable
        title="Staff Members"
        columns={columns}
        data={staff}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
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

            <TabsContent value="personal" className="space-y-4 mt-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State/Region</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="Postal code"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Enter position"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffMember['status'] })}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">NIC Number</label>
                <Input
                  value={formData.nicNumber}
                  onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                  placeholder="Enter NIC number"
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

      {viewingStaff && (
        <ViewStaffModal
          staff={viewingStaff}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingStaff(null);
          }}
        />
      )}
    </div>
  );
} 