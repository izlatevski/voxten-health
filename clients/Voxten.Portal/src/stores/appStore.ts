import { create } from 'zustand';

export type UserRole = 'nurse' | 'physician' | 'compliance_officer' | 'it_security' | 'admin';

export type PersonaId = 'patricia' | 'david' | 'rivera' | 'jordan' | 'maria';

export interface Persona {
  id: PersonaId;
  name: string;
  initials: string;
  title: string;
  role: UserRole;
  description: string;
  shortLabel: string;
}

export interface CurrentUser {
  displayName: string;
  email: string;
  roles: string[];
  scopes: string[];
  jobTitle?: string;
  username?: string;
  oid?: string;
  tenantId?: string;
  initials: string;
}

export const personas: Record<PersonaId, Persona> = {
  patricia: {
    id: 'patricia',
    name: 'Patricia Okonkwo',
    initials: 'PO',
    title: 'Chief Compliance Officer',
    role: 'compliance_officer',
    description: 'Policy, violations, audit, AI governance',
    shortLabel: 'Compliance Officer',
  },
  david: {
    id: 'david',
    name: 'David Park',
    initials: 'DP',
    title: 'CISO / VP of Technology',
    role: 'it_security',
    description: 'Azure architecture, encryption, Sentinel, security posture',
    shortLabel: 'CISO',
  },
  rivera: {
    id: 'rivera',
    name: 'Dr. James Rivera',
    initials: 'JR',
    title: 'Hospitalist / Clinical Lead',
    role: 'physician',
    description: 'Clinical comms, patient context, escalations, EHR',
    shortLabel: 'Clinical Lead',
  },
  jordan: {
    id: 'jordan',
    name: 'Jordan Morgan',
    initials: 'JM',
    title: 'Financial Advisor',
    role: 'admin',
    description: 'Client comms, FINRA compliance, off-channel alerts',
    shortLabel: 'Financial Advisor',
  },
  maria: {
    id: 'maria',
    name: 'Maria Torres, RN',
    initials: 'MT',
    title: 'Charge Nurse',
    role: 'nurse',
    description: 'Secure messaging, care team threads, alerts, handoffs',
    shortLabel: 'End User',
  },
};

export const personaOrder: PersonaId[] = ['patricia', 'david', 'rivera', 'jordan', 'maria'];

interface AppState {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentPersona: PersonaId;
  setPersona: (id: PersonaId) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isLoggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'compliance_officer',
  setRole: (role) => set({ currentRole: role }),
  currentPersona: 'patricia',
  setPersona: (id) => set({ currentPersona: id, currentRole: personas[id].role }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  isLoggedIn: false,
  setLoggedIn: (v) => set({ isLoggedIn: v }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));
