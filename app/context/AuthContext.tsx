'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { createClient } from '../../lib/supabase/client';
import { getUserProfile, getAllUsers } from '../../lib/queries/users';

export const mockUsers: User[] = [
  {
    id: 'emp1',
    name: 'Sarah Jenkins',
    role: 'Employee',
    title: 'Senior UX Designer',
    avatar: '/images/sarah_jenkins.png',
    managerId: 'mgr1',
  },
  {
    id: 'emp2',
    name: 'Michael Chen',
    role: 'Employee',
    title: 'Senior Frontend Engineer',
    avatar: '/images/michael_chen.png',
    managerId: 'mgr1',
  },
  {
    id: 'mgr1',
    name: 'Manager View',
    role: 'Manager',
    title: 'Director of Product & Engineering',
    avatar: '/images/manager_view.png',
  },
  {
    id: 'admin1',
    name: 'Admin User',
    role: 'Admin',
    title: 'Principal Systems Administrator',
    avatar: '/images/admin_user.png',
  }
];

interface AuthContextType {
  user: User | null;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  isLoading: boolean;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Load profile from auth state changes
  useEffect(() => {
    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to get session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      setIsLoading(true);
      try {
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all users when the logged-in profile changes
  useEffect(() => {
    async function loadAllUsers() {
      if (user) {
        const profiles = await getAllUsers();
        setAllUsers(profiles);
      } else {
        setAllUsers([]);
      }
    }
    loadAllUsers();
  }, [user]);

  const login = async (userId: string) => {
    setIsLoading(true);
    let email = '';
    // Map static UI IDs to real seeded Supabase Auth emails
    if (userId === 'emp1') email = 'sarah@goalstream.com';
    else if (userId === 'emp2') email = 'michael@goalstream.com';
    else if (userId === 'mgr1') email = 'manager@goalstream.com';
    else if (userId === 'admin1') email = 'admin@goalstream.com';

    if (email) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123',
      });
      if (error) {
        setIsLoading(false);
        alert(`Login failed: ${error.message}`);
      }
    } else {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setIsLoading(false);
  };
  
  const getUserById = (id: string) => {
    // Check dynamic users first
    const found = allUsers.find(u => u.id === id);
    if (found) return found;

    // Fallback to static mapping for initial rendering consistency
    const staticMap: Record<string, string> = {
      'emp1': '00000000-0000-0000-0000-000000000001',
      'emp2': '00000000-0000-0000-0000-000000000002',
      'mgr1': '00000000-0000-0000-0000-000000000003',
      'admin1': '00000000-0000-0000-0000-000000000004'
    };
    const realId = staticMap[id] || id;
    return allUsers.find(u => u.id === realId);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getUserById, isLoading, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
