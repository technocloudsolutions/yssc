'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { Users, Calendar, Clock } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  department: string;
  position: string;
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffDepartment: string;
  type: 'match' | 'meeting' | 'training';
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  eventTitle: string;
  createdAt: string;
}

const ATTENDANCE_TYPES = ['match', 'meeting', 'training'] as const;
const ATTENDANCE_STATUS = ['present', 'absent', 'late'] as const;

export default function AttendancePage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    type: 'training' as typeof ATTENDANCE_TYPES[number],
    date: new Date().toISOString().split('T')[0],
    status: 'present' as typeof ATTENDANCE_STATUS[number],
    notes: '',
    eventTitle: ''
  });

  const columns = [
    { key: 'eventTitle', label: 'Event', sortable: true },
    { key: 'staffName', label: 'Staff Name', sortable: true },
    { key: 'staffDepartment', label: 'Department', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (record: AttendanceRecord) => (
        <span className={`px-2 py-1 rounded-full text-sm ${
          record.status === 'present' ? 'bg-green-100 text-green-800' :
          record.status === 'absent' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
        </span>
      )
    }
  ];

  useEffect(() => {
    fetchStaff();
    fetchAttendanceRecords();
  }, []);

  const fetchStaff = async () => {
    try {
      const staffRef = collection(db, 'staff');
      const snapshot = await getDocs(staffRef);
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        department: doc.data().department,
        position: doc.data().position
      }));
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaff.length === 0) return;

    try {
      const timestamp = new Date().toISOString();
      const selectedStaffMembers = staff.filter(s => selectedStaff.includes(s.id));

      await Promise.all(
        selectedStaffMembers.map(async (staffMember) => {
          await addDoc(collection(db, 'attendance'), {
            staffId: staffMember.id,
            staffName: staffMember.name,
            staffDepartment: staffMember.department,
            ...formData,
            createdAt: timestamp
          });
        })
      );

      setIsModalOpen(false);
      setSelectedStaff([]);
      setFormData({
        type: 'training',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        notes: '',
        eventTitle: ''
      });
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const stats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === 'present').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.status === 'late').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Management</h1>
        <Button onClick={() => setIsModalOpen(true)}>Mark Attendance</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="text-2xl font-bold">{stats.present}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <Users className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold">{stats.absent}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Late</p>
            <p className="text-2xl font-bold">{stats.late}</p>
          </div>
        </Card>
      </div>

      <DataTable
        title="Attendance Records"
        columns={columns}
        data={attendanceRecords}
        renderCustomCell={(column, item) => {
          if (column.key === 'status' && column.render) {
            return column.render(item);
          }
          return item[column.key];
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff([]);
        }}
        title="Mark Attendance"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Staff Members</label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {staff.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaff([...selectedStaff, member.id]);
                        } else {
                          setSelectedStaff(selectedStaff.filter(id => id !== member.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{member.name}</span>
                    <span className="text-sm text-muted-foreground">({member.department})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as typeof ATTENDANCE_TYPES[number]
                  })}
                >
                  {ATTENDANCE_TYPES.map((type) => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Title</label>
                <Input
                  value={formData.eventTitle}
                  onChange={(e) => setFormData({
                    ...formData,
                    eventTitle: e.target.value
                  })}
                  placeholder="Enter event title"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({
                    ...formData,
                    date: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.status}
                  onChange={(e) => setFormData({
                    ...formData,
                    status: e.target.value as typeof ATTENDANCE_STATUS[number]
                  })}
                >
                  {ATTENDANCE_STATUS.map((status) => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({
                  ...formData,
                  notes: e.target.value
                })}
                placeholder="Add any notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedStaff([]);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedStaff.length === 0}
            >
              Mark Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 