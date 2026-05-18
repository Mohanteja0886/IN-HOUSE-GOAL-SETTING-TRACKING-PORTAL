import { createClient } from '../supabase/client';
import { User } from '../../app/types';

export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, avatar, title, manager_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    role: data.role as User['role'],
    avatar: data.avatar || '',
    title: data.title || '',
    managerId: data.manager_id || undefined,
  };
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, avatar, title, manager_id');

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    role: item.role as User['role'],
    avatar: item.avatar || '',
    title: item.title || '',
    managerId: item.manager_id || undefined,
  }));
}

export async function getDirectReports(managerId: string): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, avatar, title, manager_id')
    .eq('manager_id', managerId);

  if (error) {
    console.error('Error fetching direct reports:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    role: item.role as User['role'],
    avatar: item.avatar || '',
    title: item.title || '',
    managerId: item.manager_id || undefined,
  }));
}
