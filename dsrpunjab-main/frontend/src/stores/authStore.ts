import { create } from 'zustand';
import type { User, UserRole } from '../types/auth.types';

export const SEED_USERS: User[] = [
  { id: '1', name: 'State Admin', email: 'state.admin@punjab.gov.in', role: 'State Admin', district: 'Punjab' },
];

interface AuthState {
  user: User | null;
  users: User[];
  loginAs: (userId: string) => void;
  logout: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: SEED_USERS[0],
  users: SEED_USERS,
  
  loginAs: (userId) => set((state) => ({ 
    user: state.users.find(u => u.id === userId) || null 
  })),
  
  logout: () => set({ user: null }),
  
  updateUserRole: (userId, newRole) => set((state) => ({
    users: state.users.map(u => u.id === userId ? { ...u, role: newRole } : u)
  }))
}));
