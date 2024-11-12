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
import { Loader2 } from 'lucide-react';
import { Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Briefcase, FileText } from "lucide-react";

interface Player {
  id: string;
  // Personal Information
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  
  // Professional Information
  position: string;
  jerseyNumber: number;
  joinDate: string;
  contractUntil: string;
  marketValue: number;
  status: 'Active' | 'Injured' | 'On Loan' | 'Transfer Listed';
  
  // Additional Information
  nicNumber: string;  // National ID
  ffslNumber: string; // Football Federation Registration Number
  profilePicture?: string;
}

const POSITIONS = [
  'Goalkeeper',
  'Defender',
  'Midfielder',
  'Forward'
] as const;

const STATUS_OPTIONS = [
  'Active',
  'Injured',
  'On Loan',
  'Transfer Listed'
] as const;

const columns = [
  {
    key: 'profilePicture',
    label: '',
    sortable: false,
    render: (player: Player) => (
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
        {player.profilePicture ? (
          <img 
            src={player.profilePicture} 
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-avatar.png'; // Add a placeholder image
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
  { key: 'jerseyNumber', label: 'Jersey', sortable: true },
  { key: 'nationality', label: 'Nationality', sortable: true },
  { key: 'dateOfBirth', label: 'Date of Birth', sortable: true },
  { key: 'contractUntil', label: 'Contract Until', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

// Add this new function before the PlayersPage component
const validateFormData = (data: Omit<Player, 'id'>) => {
  // Personal Information validation
  if (!data.name || !data.email || !data.phone || !data.dateOfBirth || 
      !data.nationality || !data.address || !data.city || !data.state || !data.postalCode) {
    return { isValid: false, tab: 'personal', message: 'Please fill all personal information fields' };
  }

  // Professional Information validation
  if (!data.position || !data.jerseyNumber || !data.joinDate || 
      !data.contractUntil || !data.marketValue || !data.status) {
    return { isValid: false, tab: 'professional', message: 'Please fill all professional information fields' };
  }

  // Additional Information validation
  if (!data.nicNumber || !data.ffslNumber) {
    return { isValid: false, tab: 'additional', message: 'Please fill all additional information fields' };
  }

  return { isValid: true, tab: null, message: '' };
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [formData, setFormData] = useState<Omit<Player, 'id'>>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    position: 'Midfielder',
    jerseyNumber: 1,
    joinDate: '',
    contractUntil: '',
    marketValue: 0,
    status: 'Active',
    nicNumber: '',
    ffslNumber: '',
    profilePicture: ''
  });

  const [uploading, setUploading] = useState(false);

  const [activeTab, setActiveTab] = useState('personal');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const playersRef = collection(db, 'players');
      const snapshot = await getDocs(playersRef);
      const playersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching players:', error);
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
      if (editingPlayer) {
        const playerRef = doc(db, 'players', editingPlayer.id);
        await updateDoc(playerRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'players'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      
      setIsModalOpen(false);
      setEditingPlayer(null);
      resetForm();
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      setFormError('Failed to save player data. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      try {
        await deleteDoc(doc(db, 'players', id));
        fetchPlayers();
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      position: 'Midfielder',
      jerseyNumber: 1,
      joinDate: '',
      contractUntil: '',
      marketValue: 0,
      status: 'Active',
      nicNumber: '',
      ffslNumber: '',
      profilePicture: ''
    });
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      email: player.email,
      phone: player.phone,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      address: player.address,
      city: player.city,
      state: player.state,
      postalCode: player.postalCode,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      joinDate: player.joinDate,
      contractUntil: player.contractUntil,
      marketValue: player.marketValue,
      status: player.status,
      nicNumber: player.nicNumber,
      ffslNumber: player.ffslNumber,
      profilePicture: player.profilePicture
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `players/${file.name}-${Date.now()}`);
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
        <h1 className="text-2xl font-bold">Players Management</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Player</Button>
      </div>

      <DataTable
        title="Players"
        columns={columns}
        data={players}
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
          setEditingPlayer(null);
          resetForm();
        }}
        title={editingPlayer ? 'Edit Player' : 'Add New Player'}
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

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nationality</label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Enter nationality"
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
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jersey Number</label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.jerseyNumber}
                    onChange={(e) => setFormData({ ...formData, jerseyNumber: Number(e.target.value) })}
                    required
                  />
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
                  <label className="text-sm font-medium">Contract Until</label>
                  <Input
                    type="date"
                    value={formData.contractUntil}
                    onChange={(e) => setFormData({ ...formData, contractUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Market Value (€)</label>
                  <Input
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.marketValue}
                    onChange={(e) => setFormData({ ...formData, marketValue: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Player['status'] })}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">NIC Number</label>
                  <Input
                    value={formData.nicNumber}
                    onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                    placeholder="Enter NIC number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">FFSL Number</label>
                  <Input
                    value={formData.ffslNumber}
                    onChange={(e) => setFormData({ ...formData, ffslNumber: e.target.value })}
                    placeholder="Enter FFSL number"
                    required
                  />
                </div>
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
                  setEditingPlayer(null);
                  resetForm();
                  setFormError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPlayer ? 'Update' : 'Add'} Player
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
} 