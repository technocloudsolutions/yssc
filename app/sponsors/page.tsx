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
import { Loader2, Building2, FileText, Printer, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Sponsor {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  sponsorshipType: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  sponsorshipAmount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Pending' | 'Expired' | 'Terminated';
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface ViewModalProps {
  sponsor: Sponsor;
  isOpen: boolean;
  onClose: () => void;
}

function ViewSponsorModal({ sponsor, isOpen, onClose }: ViewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sponsor Details">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
            {sponsor.logo ? (
              <img 
                src={sponsor.logo} 
                alt={sponsor.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Building2 className="h-8 w-8" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{sponsor.name}</h2>
            <p className="text-muted-foreground">
              {sponsor.sponsorshipType} Sponsor
            </p>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sponsorship">Sponsorship</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Industry</label>
                <p className="text-sm">{sponsor.industry || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Website</label>
                <p className="text-sm">{sponsor.website || 'N/A'}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sponsorship" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-sm">{sponsor.sponsorshipType}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <p className="text-sm">LKR {sponsor.sponsorshipAmount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <p className="text-sm">{sponsor.startDate || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <p className="text-sm">{sponsor.endDate || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm">{sponsor.status}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm">{sponsor.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="text-sm">{sponsor.phone || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Address</label>
                <p className="text-sm">
                  {[
                    sponsor.address,
                    sponsor.city,
                    sponsor.state,
                    sponsor.postalCode
                  ].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState<Omit<Sponsor, 'id'>>({
    name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    sponsorshipType: 'Gold',
    sponsorshipAmount: 0,
    startDate: '',
    endDate: '',
    status: 'Active',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const sponsorsCollection = collection(db, 'sponsors');
      const sponsorsSnapshot = await getDocs(sponsorsCollection);
      const sponsorsList = sponsorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sponsor[];
      setSponsors(sponsorsList);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter sponsor name');
      return;
    }

    try {
      if (selectedSponsor) {
        await updateDoc(doc(db, 'sponsors', selectedSponsor.id), formData);
      } else {
        await addDoc(collection(db, 'sponsors'), formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchSponsors();
    } catch (error) {
      console.error('Error saving sponsor:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sponsor?')) return;
    try {
      await deleteDoc(doc(db, 'sponsors', id));
      fetchSponsors();
    } catch (error) {
      console.error('Error deleting sponsor:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      sponsorshipType: 'Gold',
      sponsorshipAmount: 0,
      startDate: '',
      endDate: '',
      status: 'Active',
      address: '',
      city: '',
      state: '',
      postalCode: '',
    });
    setSelectedSponsor(null);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setFormData(sponsor);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `sponsor-logos/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, logo: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleView = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsViewModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'sponsorshipType',
      label: 'Type',
      sortable: true
    },
    {
      key: 'sponsorshipAmount',
      label: 'Amount',
      sortable: true,
      render: (row: Sponsor) => `LKR ${row.sponsorshipAmount.toLocaleString()}`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: Sponsor) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleView(row)}>
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sponsors</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sponsor
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={sponsors}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Logo</label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name*</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.sponsorshipType}
                onChange={(e) => setFormData(prev => ({ ...prev, sponsorshipType: e.target.value as any }))}
              >
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input
                type="number"
                value={formData.sponsorshipAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, sponsorshipAmount: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit">
              {selectedSponsor ? 'Update' : 'Add'} Sponsor
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {selectedSponsor && (
        <ViewSponsorModal
          sponsor={selectedSponsor}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedSponsor(null);
          }}
        />
      )}
    </div>
  );
} 