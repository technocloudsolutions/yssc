import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const defaultDepartments = [
  { name: 'Technical Staff', description: 'Coaching and training staff' },
  { name: 'Medical', description: 'Medical and physiotherapy team' },
  { name: 'Administration', description: 'Club administration and management' },
  { name: 'Youth Academy', description: 'Youth development program' },
  { name: 'Scouting', description: 'Player scouting and recruitment' }
];

const defaultRoles = [
  { name: 'Head Coach', department: 'Technical Staff', description: 'Team head coach' },
  { name: 'Assistant Coach', department: 'Technical Staff', description: 'Assistant to head coach' },
  { name: 'Team Doctor', department: 'Medical', description: 'Team physician' },
  { name: 'Physiotherapist', department: 'Medical', description: 'Player rehabilitation' },
  { name: 'Club Manager', department: 'Administration', description: 'Overall club management' }
];

const defaultAccountTypes = [
  { name: 'Match Day Revenue', type: 'Income', description: 'Revenue from matches', status: 'Active' },
  { name: 'Sponsorship', type: 'Income', description: 'Sponsorship income', status: 'Active' },
  { name: 'Player Wages', type: 'Expense', description: 'Player salaries', status: 'Active' },
  { name: 'Operating Costs', type: 'Expense', description: 'Daily operation costs', status: 'Active' }
];

const defaultCategories = [
  { name: 'Match Revenue', type: 'Income', description: 'Revenue from matches', status: 'Active' },
  { name: 'Sponsorship', type: 'Income', description: 'Sponsorship deals', status: 'Active' },
  { name: 'Merchandise Sales', type: 'Income', description: 'Club merchandise', status: 'Active' },
  { name: 'Player Salaries', type: 'Expense', description: 'Player wages', status: 'Active' },
  { name: 'Equipment', type: 'Expense', description: 'Sports equipment', status: 'Active' },
  { name: 'Facility Maintenance', type: 'Expense', description: 'Maintenance costs', status: 'Active' }
];

const defaultStaff = [
  {
    name: 'John Smith',
    position: 'Head Coach',
    department: 'Technical Staff',
    email: 'john.smith@example.com',
    phone: '+1234567890',
    joinDate: '2023-01-01',
    status: 'Active'
  },
  {
    name: 'Sarah Johnson',
    position: 'Team Doctor',
    department: 'Medical',
    email: 'sarah.johnson@example.com',
    phone: '+1234567891',
    joinDate: '2023-02-01',
    status: 'Active'
  },
  {
    name: 'Mike Wilson',
    position: 'Assistant Coach',
    department: 'Technical Staff',
    email: 'mike.wilson@example.com',
    phone: '+1234567892',
    joinDate: '2023-03-01',
    status: 'Active'
  }
];

const defaultPlayers = [
  {
    name: 'John Smith',
    position: 'Forward',
    nationality: 'England',
    age: 24,
    jerseyNumber: 9,
    contractUntil: '2025-06-30',
    marketValue: 25000000,
    status: 'Active'
  },
  {
    name: 'David Martinez',
    position: 'Midfielder',
    nationality: 'Spain',
    age: 26,
    jerseyNumber: 8,
    contractUntil: '2024-06-30',
    marketValue: 20000000,
    status: 'Active'
  },
  {
    name: 'Michael Johnson',
    position: 'Defender',
    nationality: 'England',
    age: 28,
    jerseyNumber: 4,
    contractUntil: '2025-06-30',
    marketValue: 15000000,
    status: 'Active'
  },
  {
    name: 'Peter Wilson',
    position: 'Goalkeeper',
    nationality: 'Germany',
    age: 29,
    jerseyNumber: 1,
    contractUntil: '2024-06-30',
    marketValue: 12000000,
    status: 'Active'
  }
];

const defaultReports = [
  {
    title: "Monthly Financial Report - March 2024",
    category: "financial",
    date: "2024-03-31",
    status: "Generated",
    summary: "Financial overview for March 2024",
    data: {
      summary: {
        totalIncome: 250000,
        totalExpenses: 180000,
        netProfit: 70000,
        transactionCount: 45
      },
      details: {
        incomeBreakdown: {
          "Match Revenue": "LKR 150000",
          "Sponsorship": "LKR 60000",
          "Merchandise": "LKR 40000"
        },
        expenseBreakdown: {
          "Player Salaries": "LKR 100000",
          "Equipment": "LKR 30000",
          "Facility Maintenance": "LKR 50000"
        },
        topIncomeCategories: [
          { category: "Match Revenue", amount: 150000 },
          { category: "Sponsorship", amount: 60000 },
          { category: "Merchandise", amount: 40000 }
        ],
        topExpenseCategories: [
          { category: "Player Salaries", amount: 100000 },
          { category: "Facility Maintenance", amount: 50000 },
          { category: "Equipment", amount: 30000 }
        ]
      },
      period: "March 2024"
    }
  },
  {
    title: "Team Performance Analysis - Q1 2024",
    category: "performance",
    date: "2024-03-31",
    status: "Generated",
    summary: "Quarterly team performance metrics",
    data: {
      summary: {
        totalPlayers: 25,
        averageTeamRating: 7.8,
        totalGoals: 45,
        totalAssists: 32
      },
      details: {
        positionBreakdown: {
          "Goalkeeper": {
            count: 3,
            averageRating: 7.5,
            totalGoals: 0,
            totalAssists: 0
          },
          "Defender": {
            count: 8,
            averageRating: 7.7,
            totalGoals: 5,
            totalAssists: 8
          },
          "Midfielder": {
            count: 8,
            averageRating: 7.9,
            totalGoals: 15,
            totalAssists: 20
          },
          "Forward": {
            count: 6,
            averageRating: 8.0,
            totalGoals: 25,
            totalAssists: 4
          }
        },
        topPerformers: [
          { name: "John Smith", rating: 8.5, goals: 12, assists: 8, form: "Excellent" },
          { name: "David Martinez", rating: 8.3, goals: 8, assists: 12, form: "Good" },
          { name: "Michael Johnson", rating: 8.2, goals: 6, assists: 5, form: "Good" }
        ],
        formAnalysis: {
          excellent: 5,
          good: 12,
          average: 6,
          poor: 2
        }
      },
      period: "Q1 2024"
    }
  },
  {
    title: "Monthly Attendance Report - March 2024",
    category: "attendance",
    date: "2024-03-31",
    status: "Generated",
    summary: "Team attendance and training participation",
    data: {
      totalSessions: 20,
      averageAttendance: 92,
      byPosition: {
        Goalkeeper: 95,
        Defender: 93,
        Midfielder: 90,
        Forward: 91
      },
      missedSessions: {
        injury: 8,
        personal: 5,
        unexcused: 2
      },
      period: "March 2024"
    }
  },
  {
    title: "Medical Status Report - March 2024",
    category: "medical",
    date: "2024-03-31",
    status: "Generated",
    summary: "Team medical and injury status overview",
    data: {
      activeInjuries: {
        minor: 3,
        moderate: 2,
        severe: 1
      },
      rehabilitationProgress: {
        completed: 4,
        ongoing: 2,
        starting: 1
      },
      injuryTypes: {
        muscle: 2,
        joint: 3,
        other: 1
      },
      averageRecoveryTime: 12,
      period: "March 2024"
    }
  }
];

export async function initializeSettings() {
  try {
    // Check if data already exists
    const collections = [
      'departments', 
      'roles', 
      'accountTypes', 
      'categories', 
      'staff', 
      'players',
      'reports'
    ];

    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      if (snapshot.empty) {
        // Initialize the collection with default data
        const defaultData = {
          departments: defaultDepartments,
          roles: defaultRoles,
          accountTypes: defaultAccountTypes,
          categories: defaultCategories,
          staff: defaultStaff,
          players: defaultPlayers,
          reports: defaultReports
        }[collectionName];

        if (defaultData) {
          for (const item of defaultData) {
            await addDoc(collection(db, collectionName), {
              ...item,
              createdAt: new Date().toISOString()
            });
          }
          console.log(`Initialized ${collectionName}`);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
} 