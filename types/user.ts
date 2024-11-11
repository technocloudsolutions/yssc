import { User as FirebaseUser } from 'firebase/auth';

export interface CustomUser extends FirebaseUser {
  role?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
} 