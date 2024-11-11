'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

// Define the state types
interface AppState {
  players: any[];
  staff: any[];
  transactions: any[];
  performances: any[];
}

// Define action types
type AppAction =
  | { type: 'SET_PLAYERS'; payload: any[] }
  | { type: 'ADD_PLAYER'; payload: any }
  | { type: 'UPDATE_PLAYER'; payload: { id: string; data: any } }
  | { type: 'DELETE_PLAYER'; payload: string }
  | { type: 'SET_STAFF'; payload: any[] }
  | { type: 'ADD_STAFF'; payload: any }
  | { type: 'UPDATE_STAFF'; payload: { id: string; data: any } }
  | { type: 'DELETE_STAFF'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: any[] }
  | { type: 'ADD_TRANSACTION'; payload: any }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; data: any } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_PERFORMANCES'; payload: any[] }
  | { type: 'ADD_PERFORMANCE'; payload: any }
  | { type: 'UPDATE_PERFORMANCE'; payload: { id: string; data: any } }
  | { type: 'DELETE_PERFORMANCE'; payload: string };

const initialState: AppState = {
  players: [],
  staff: [],
  transactions: [],
  performances: [],
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.id ? { ...player, ...action.payload.data } : player
        ),
      };
    case 'DELETE_PLAYER':
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.payload),
      };
    // Similar cases for staff, transactions, and performances
    case 'SET_STAFF':
      return { ...state, staff: action.payload };
    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] };
    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(staff =>
          staff.id === action.payload.id ? { ...staff, ...action.payload.data } : staff
        ),
      };
    case 'DELETE_STAFF':
      return {
        ...state,
        staff: state.staff.filter(staff => staff.id !== action.payload),
      };
    // Add more cases for transactions and performances
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 