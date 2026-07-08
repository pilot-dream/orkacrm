import { create } from 'zustand';
import type { Profile, Notification, TeamMember } from './types';

interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  userEmail: string;
  userProfile: Profile | null;
  teamMembers: TeamMember[];
  notifications: Notification[];
  isNewUser: boolean;
  
  login: (email: string) => void;
  logout: () => void;
  setInitialized: (val: boolean) => void;
  setUserProfile: (profile: Profile | null) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isInitialized: false,
  isAuthenticated: false,
  userEmail: '',
  userProfile: null,
  teamMembers: [],
  notifications: [],
  isNewUser: false,

  login: (email) => {
    const emailLower = email.toLowerCase();
    const isNew = emailLower !== 'admin@orka.ai';
    set({
      isAuthenticated: true,
      userEmail: emailLower,
      isNewUser: isNew,
    });
  },

  logout: () => {
    set({
      isAuthenticated: false,
      userEmail: '',
      userProfile: null,
      isNewUser: false,
    });
  },

  setInitialized: (val) => set({ isInitialized: val }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setTeamMembers: (members) => set({ teamMembers: members }),
  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) => 
    set((state) => ({ notifications: [notification, ...state.notifications] })),
    
  markNotificationAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      if (state.userEmail) {
        localStorage.setItem(`orka_notifs_${state.userEmail}`, JSON.stringify(updated));
      }
      return { notifications: updated };
    }),
}));
