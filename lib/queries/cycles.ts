import { createClient } from '../supabase/client';

export interface Cycle {
  id: string;
  name: string;
  isOpen: boolean;
}

export async function getActiveCycle(): Promise<Cycle | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cycles')
    .select('id, name, is_open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active cycle:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    isOpen: data.is_open,
  };
}

export async function toggleCycleWindow(cycleId: string, isOpen: boolean): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('cycles')
    .update({ is_open: isOpen })
    .eq('id', cycleId);

  if (error) {
    console.error('Error updating cycle status:', error);
    return false;
  }

  return true;
}

export async function createCycle(name: string, isOpen: boolean): Promise<Cycle | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cycles')
    .insert({ name, is_open: isOpen })
    .select('id, name, is_open')
    .single();

  if (error) {
    console.error('Error creating new cycle:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    isOpen: data.is_open,
  };
}
