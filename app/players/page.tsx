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
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
            <div className="text-center mb-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {formData.profilePicture ? (
                    <img 
                      src={formData.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
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
                    onClick={() => document.getElementById('profilePicture')?.click()}
                    disabled={uploading}
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
          </div>

          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">State/Region</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">ZIP/Postal Code</label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Position</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                >
                  {POSITIONS.map((position) => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Jersey Number</label>
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
              <div>
                <label className="block text-sm mb-2">Join Date</label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Contract Until</label>
                <Input
                  type="date"
                  value={formData.contractUntil}
                  onChange={(e) => setFormData({ ...formData, contractUntil: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Market Value (€)</label>
                <Input
                  type="number"
                  min="0"
                  step="100000"
                  value={formData.marketValue}
                  onChange={(e) => setFormData({ ...formData, marketValue: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
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
          </div>

          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">NIC No</label>
                <Input
                  value={formData.nicNumber}
                  onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">FFSL No</label>
                <Input
                  value={formData.ffslNumber}
                  onChange={(e) => setFormData({ ...formData, ffslNumber: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit">
              {editingPlayer ? 'Update' : 'Add'} Player
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPlayer(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 