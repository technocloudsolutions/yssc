'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Trophy, Target, Activity, Star, TrendingUp, Award } from 'lucide-react';

interface PlayerPerformance {
  id: string;
  playerName: string;
  position: string;
  gamesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets?: number; // For goalkeepers
  saves?: number; // For goalkeepers
  tackles: number;
  interceptions: number;
  passAccuracy: number;
  shotAccuracy: number;
  rating: number;
  matchDate: string;
  competition: string;
  opponent: string;
  result: string;
  form: 'Excellent' | 'Good' | 'Average' | 'Poor';
  notes?: string;
}

const FORM_OPTIONS = ['Excellent', 'Good', 'Average', 'Poor'] as const;
const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] as const;

const columns = [
  { key: 'playerName', label: 'Player', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'matchDate', label: 'Date', sortable: true },
  { key: 'opponent', label: 'Opponent', sortable: true },
  { key: 'result', label: 'Result', sortable: true },
  { key: 'minutesPlayed', label: 'Minutes', sortable: true },
  { key: 'goals', label: 'Goals', sortable: true },
  { key: 'assists', label: 'Assists', sortable: true },
  { 
    key: 'rating', 
    label: 'Rating', 
    sortable: true,
    render: (performance: PlayerPerformance) => (
      <span className={`font-bold ${
        performance.rating >= 8 ? 'text-green-500' :
        performance.rating >= 6 ? 'text-yellow-500' :
        'text-red-500'
      }`}>
        {performance.rating.toFixed(1)}
      </span>
    )
  },
  { 
    key: 'form', 
    label: 'Form', 
    sortable: true,
    render: (performance: PlayerPerformance) => (
      <span className={`px-2 py-1 rounded-full text-sm ${
        performance.form === 'Excellent' ? 'bg-green-100 text-green-800' :
        performance.form === 'Good' ? 'bg-blue-100 text-blue-800' :
        performance.form === 'Average' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {performance.form}
      </span>
    )
  }
];

export default function PerformancePage() {
  const [performances, setPerformances] = useState<PlayerPerformance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState<PlayerPerformance | null>(null);
  const [players, setPlayers] = useState<{ name: string; position: string }[]>([]);

  const [formData, setFormData] = useState({
    playerName: '',
    position: '',
    gamesPlayed: 0,
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 0,
    saves: 0,
    tackles: 0,
    interceptions: 0,
    passAccuracy: 0,
    shotAccuracy: 0,
    rating: 0,
    matchDate: '',
    competition: '',
    opponent: '',
    result: '',
    form: 'Average' as (typeof FORM_OPTIONS)[number],
    notes: ''
  });

  useEffect(() => {
    fetchPerformances();
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const playersRef = collection(db, 'players');
      const snapshot = await getDocs(playersRef);
      const playersData = snapshot.docs.map(doc => ({
        name: doc.data().name,
        position: doc.data().position
      }));
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchPerformances = async () => {
    try {
      const performancesRef = collection(db, 'performances');
      const snapshot = await getDocs(performancesRef);
      const performanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlayerPerformance[];
      setPerformances(performanceData);
    } catch (error) {
      console.error('Error fetching performances:', error);
    }
  };

  const calculateStats = () => {
    const totalGames = performances.length;
    const totalGoals = performances.reduce((sum, p) => sum + p.goals, 0);
    const totalAssists = performances.reduce((sum, p) => sum + p.assists, 0);
    const averageRating = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.rating, 0) / performances.length
      : 0;
    const cleanSheets = performances.filter(p => p.cleanSheets).length;
    const formBreakdown = performances.reduce((acc, p) => {
      acc[p.form] = (acc[p.form] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGames,
      totalGoals,
      totalAssists,
      averageRating,
      cleanSheets,
      formBreakdown
    };
  };

  const stats = calculateStats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedPlayer = players.find(p => p.name === formData.playerName);
      const performanceData = {
        ...formData,
        position: selectedPlayer?.position || formData.position,
        rating: Number(formData.rating),
        goals: Number(formData.goals),
        assists: Number(formData.assists),
        createdAt: new Date().toISOString()
      };

      if (editingPerformance) {
        await updateDoc(doc(db, 'performances', editingPerformance.id), performanceData);
      } else {
        await addDoc(collection(db, 'performances'), performanceData);
      }

      setIsModalOpen(false);
      setEditingPerformance(null);
      resetForm();
      fetchPerformances();
    } catch (error) {
      console.error('Error saving performance:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      playerName: '',
      position: '',
      gamesPlayed: 0,
      minutesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      cleanSheets: 0,
      saves: 0,
      tackles: 0,
      interceptions: 0,
      passAccuracy: 0,
      shotAccuracy: 0,
      rating: 0,
      matchDate: '',
      competition: '',
      opponent: '',
      result: '',
      form: 'Average',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Performance Tracking</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          Add Performance
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Games</p>
              <h3 className="text-2xl font-bold">{stats.totalGames}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Goals</p>
              <h3 className="text-2xl font-bold">{stats.totalGoals}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Assists</p>
              <h3 className="text-2xl font-bold">{stats.totalAssists}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Rating</p>
              <h3 className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clean Sheets</p>
              <h3 className="text-2xl font-bold">{stats.cleanSheets}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Form</p>
              <h3 className="text-2xl font-bold">
                {stats.formBreakdown['Excellent'] || 0}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={performances}
        onEdit={(performance) => {
          setEditingPerformance(performance);
          setFormData(performance);
          setIsModalOpen(true);
        }}
        onDelete={async (id) => {
          if (confirm('Are you sure you want to delete this performance record?')) {
            await deleteDoc(doc(db, 'performances', id));
            fetchPerformances();
          }
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPerformance(null);
          resetForm();
        }}
        title={editingPerformance ? 'Edit Performance' : 'Add Performance'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Player</label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.playerName}
                onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                required
              >
                <option value="">Select Player</option>
                {players.map((player) => (
                  <option key={player.name} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Match Date</label>
              <Input
                type="date"
                value={formData.matchDate}
                onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Competition</label>
              <Input
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Opponent</label>
              <Input
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">Result</label>
              <Input
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                placeholder="e.g., 2-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Minutes Played</label>
              <Input
                type="number"
                min="0"
                max="120"
                value={formData.minutesPlayed}
                onChange={(e) => setFormData({ ...formData, minutesPlayed: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Rating</label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-2">Goals</label>
              <Input
                type="number"
                min="0"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Assists</label>
              <Input
                type="number"
                min="0"
                value={formData.assists}
                onChange={(e) => setFormData({ ...formData, assists: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Yellow Cards</label>
              <Input
                type="number"
                min="0"
                max="2"
                value={formData.yellowCards}
                onChange={(e) => setFormData({ ...formData, yellowCards: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Red Cards</label>
              <Input
                type="number"
                min="0"
                max="1"
                value={formData.redCards}
                onChange={(e) => setFormData({ ...formData, redCards: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Form</label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.form}
                onChange={(e) => setFormData({ ...formData, form: e.target.value as typeof FORM_OPTIONS[number] })}
                required
              >
                {FORM_OPTIONS.map((form) => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Pass Accuracy (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.passAccuracy}
                onChange={(e) => setFormData({ ...formData, passAccuracy: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Notes</label>
            <textarea
              className="w-full p-2 border rounded-md"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit">
              {editingPerformance ? 'Update' : 'Add'} Performance
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPerformance(null);
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