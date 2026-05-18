import { createClient } from '../supabase/client';

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  type: 'success' | 'info' | 'warning';
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, actor, action, timestamp, type')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    actor: item.actor,
    action: item.action,
    timestamp: item.timestamp,
    type: item.type as AuditLog['type']
  }));
}

export async function writeAuditLog(
  actor: string,
  action: string,
  type: 'success' | 'info' | 'warning'
): Promise<boolean> {
  const supabase = createClient();

  const now = new Date();
  const timeString = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
  const timestamp = `${dateString}, ${timeString}`;

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      actor,
      action,
      timestamp,
      type
    });

  if (error) {
    console.error('Error writing audit log:', error);
    return false;
  }

  return true;
}
