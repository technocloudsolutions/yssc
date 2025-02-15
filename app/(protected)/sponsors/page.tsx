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

interface SponsorshipType {
  id: string;
  name: string;
}

interface Sponsor {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  website: string;
  sponsorshipType: string;
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
                <label className="text-sm font-medium">Company Name</label>
                <p className="text-sm">{sponsor.companyName || 'N/A'}</p>
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
  const [sponsorshipTypes, setSponsorshipTypes] = useState<SponsorshipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState<Omit<Sponsor, 'id'>>({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    website: '',
    sponsorshipType: 'Gold',
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
    fetchSponsorshipTypes();
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

  const fetchSponsorshipTypes = async () => {
    try {
      const typesCollection = collection(db, 'sponsorshipTypes');
      const typesSnapshot = await getDocs(typesCollection);
      const typesList = typesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SponsorshipType[];
      setSponsorshipTypes(typesList);
    } catch (error) {
      console.error('Error fetching sponsorship types:', error);
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
      companyName: '',
      email: '',
      phone: '',
      website: '',
      sponsorshipType: 'Gold',
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

  const handleView = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsViewModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row: Sponsor) => row.name
    },
    {
      key: 'companyName',
      label: 'Company Name',
      sortable: true,
      render: (row: Sponsor) => row.companyName
    },
    {
      key: 'sponsorshipType',
      label: 'Type',
      sortable: true,
      render: (row: Sponsor) => row.sponsorshipType
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row: Sponsor) => row.status
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: Sponsor) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(row)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sponsors</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sponsor
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <DataTable
          columns={columns}
          data={sponsors}
        />
      </Card>

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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sponsorship Type</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.sponsorshipType}
                onChange={(e) => setFormData({ ...formData, sponsorshipType: e.target.value })}
              >
                {sponsorshipTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Street Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">State/Province</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Postal Code</label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
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
            <Button type="submit">
              {selectedSponsor ? 'Update' : 'Create'} Sponsor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 