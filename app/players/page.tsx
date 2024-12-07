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
import { Users, UserCircle, Briefcase, FileText, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  jerseyNumber?: number;
  joinDate: string;
  contractUntil: string;
  status: 'Active' | 'Injured' | 'On Loan' | 'Transfer Listed';
  
  // Additional Information
  nicNumber: string;  // National ID
  ffslNumber: string; // Football Federation Registration Number
  profilePicture?: string;
}

interface ViewModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

function ViewPlayerModal({ player, isOpen, onClose }: ViewModalProps) {
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate the print content with styles
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Player Details - ${player.name}</title>
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
            .player-image {
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
              src="${player.profilePicture || '/placeholder-avatar.png'}" 
              alt="${player.name}"
              class="player-image"
            />
            <h1>${player.name}</h1>
            <p>${player.position} • #${player.jerseyNumber}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Personal Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${player.email || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${player.phone || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">${player.dateOfBirth || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Nationality</div>
                <div class="info-value">${player.nationality || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Address</div>
                <div class="info-value">${`${player.address || ''} ${player.city || ''} ${player.state || ''} ${player.postalCode || ''}`.trim() || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Professional Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Position</div>
                <div class="info-value">${player.position}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Jersey Number</div>
                <div class="info-value">#${player.jerseyNumber}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Join Date</div>
                <div class="info-value">${player.joinDate || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Contract Until</div>
                <div class="info-value">${player.contractUntil || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">${player.status}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Additional Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">NIC Number</div>
                <div class="info-value">${player.nicNumber || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">FFSL Number</div>
                <div class="info-value">${player.ffslNumber || 'N/A'}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Write the content to the new window and print
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Player Details">
      <div className="space-y-6">
        {/* Header with player image and basic info */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {player.profilePicture ? (
              <img 
                src={player.profilePicture} 
                alt={player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Users className="h-8 w-8" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{player.name}</h2>
            <p className="text-muted-foreground">
              {player.position} • #{player.jerseyNumber}
            </p>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card className="p-4">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd>{player.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                  <dd>{player.phone || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
                  <dd>{player.dateOfBirth || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Nationality</dt>
                  <dd>{player.nationality || 'N/A'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                  <dd>{`${player.address || ''} ${player.city || ''} ${player.state || ''} ${player.postalCode || ''}`.trim() || 'N/A'}</dd>
                </div>
              </dl>
            </Card>
          </TabsContent>

          <TabsContent value="professional" className="space-y-4">
            <Card className="p-4">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Position</dt>
                  <dd>{player.position}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Jersey Number</dt>
                  <dd>#{player.jerseyNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Join Date</dt>
                  <dd>{player.joinDate || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Contract Until</dt>
                  <dd>{player.contractUntil || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd>{player.status}</dd>
                </div>
              </dl>
            </Card>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <Card className="p-4">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">NIC Number</dt>
                  <dd>{player.nicNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">FFSL Number</dt>
                  <dd>{player.ffslNumber || 'N/A'}</dd>
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
    jerseyNumber: undefined,
    joinDate: '',
    contractUntil: '',
    status: 'Active',
    nicNumber: '',
    ffslNumber: '',
    profilePicture: ''
  });

  const [uploading, setUploading] = useState(false);

  const [activeTab, setActiveTab] = useState('personal');
  const [formError, setFormError] = useState('');

  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
      return;
    }

    try {
      // Clean up the data before saving
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Skip empty strings, undefined, and null values
        if (value !== '' && value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Add timestamp
      cleanedData.updatedAt = new Date().toISOString();

      if (editingPlayer) {
        const playerRef = doc(db, 'players', editingPlayer.id);
        await updateDoc(playerRef, cleanedData);
      } else {
        await addDoc(collection(db, 'players'), {
          ...cleanedData,
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
      jerseyNumber: undefined,
      joinDate: '',
      contractUntil: '',
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

  const handleView = (player: Player) => {
    setViewingPlayer(player);
    setIsViewModalOpen(true);
  };

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
    { key: 'jerseyNumber', label: 'Jersey', sortable: true },
    { key: 'nationality', label: 'Nationality', sortable: true },
    { key: 'dateOfBirth', label: 'Date of Birth', sortable: true },
    { key: 'contractUntil', label: 'Contract Until', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (player: Player) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleView(player)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(player)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(player.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  // Add this new function before the PlayersPage component
  const validateFormData = (data: Omit<Player, 'id'>) => {
    if (!data.name || data.name.trim() === '') {
      return { isValid: false, message: 'Name is required' };
    }
    return { isValid: true, message: '' };
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address (Optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number (Optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nationality</label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Enter nationality (Optional)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter street address (Optional)"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City (Optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State/Region</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State (Optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="Postal code (Optional)"
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
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jersey Number (Optional)</label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.jerseyNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ 
                        ...formData, 
                        jerseyNumber: value === '' ? undefined : Number(value)
                      });
                    }}
                    placeholder="Enter jersey number"
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contract Until</label>
                  <Input
                    type="date"
                    value={formData.contractUntil}
                    onChange={(e) => setFormData({ ...formData, contractUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Player['status'] })}
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">FFSL Number</label>
                  <Input
                    value={formData.ffslNumber}
                    onChange={(e) => setFormData({ ...formData, ffslNumber: e.target.value })}
                    placeholder="Enter FFSL number"
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

      {viewingPlayer && (
        <ViewPlayerModal
          player={viewingPlayer}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingPlayer(null);
          }}
        />
      )}
    </div>
  );
} 