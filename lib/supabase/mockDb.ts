// Mock Database for GoalStream Offline/Demo Mode
// Automatically mirrors the seeded database state from supabase_schema.sql

export interface MockUser {
  id: string;
  name: string;
  role: 'Employee' | 'Manager' | 'Admin';
  avatar: string;
  title: string;
  manager_id: string | null;
}

export interface MockCycle {
  id: string;
  name: string;
  is_open: boolean;
  created_at: string;
}

export interface MockGoal {
  id: string;
  employee_id: string;
  cycle_id: string | null;
  title: string;
  thrust_area: string;
  description: string;
  uom: 'numeric' | 'percentage' | 'timeline' | 'binary';
  target: string;
  weightage: number;
  status: 'Pending Review' | 'Returned' | 'Submitted' | 'Locked' | 'On Track' | 'Behind' | 'Completed' | 'Scheduled';
  locked: boolean;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface MockAchievement {
  id: string;
  goal_id: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  created_at: string;
  updated_at: string;
}

export interface MockComment {
  id: string;
  goal_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface MockAuditLog {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  type: 'success' | 'info' | 'warning';
  created_at: string;
}

// Initial Seeds
const initialUsers: MockUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Manager View',
    role: 'Manager',
    avatar: '/images/manager_view.png',
    title: 'Director of Product & Engineering',
    manager_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Sarah Jenkins',
    role: 'Employee',
    avatar: '/images/sarah_jenkins.png',
    title: 'Senior UX Designer',
    manager_id: '00000000-0000-0000-0000-000000000003'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Michael Chen',
    role: 'Employee',
    avatar: '/images/michael_chen.png',
    title: 'Senior Frontend Engineer',
    manager_id: '00000000-0000-0000-0000-000000000003'
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Admin User',
    role: 'Admin',
    avatar: '/images/admin_user.png',
    title: 'Principal Systems Administrator',
    manager_id: null
  }
];

const initialCycles: MockCycle[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'FY24 Objectives',
    is_open: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const initialGoals: MockGoal[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    employee_id: '00000000-0000-0000-0000-000000000001',
    cycle_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Increase Cloud Infrastructure Uptime',
    thrust_area: 'stability',
    description: 'Target: Maintain 99.99% availability across all production regions and optimize load balancing clusters.',
    uom: 'percentage',
    target: '99.99',
    weightage: 25,
    status: 'On Track',
    locked: false,
    last_updated: '2 hours ago',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    employee_id: '00000000-0000-0000-0000-000000000001',
    cycle_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Reduce Open Bug Backlog',
    thrust_area: 'stability',
    description: 'Resolve high-priority P1/P2 issues to keep total open bug count under target threshold.',
    uom: 'numeric',
    target: '0',
    weightage: 15,
    status: 'Behind',
    locked: false,
    last_updated: 'Yesterday',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    employee_id: '00000000-0000-0000-0000-000000000002',
    cycle_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Complete Advanced Security Certification',
    thrust_area: 'culture',
    description: 'Complete mandatory ISO/IEC 27001 corporate compliance and technical security recertification.',
    uom: 'binary',
    target: 'Yes',
    weightage: 20,
    status: 'Completed',
    locked: false,
    last_updated: 'Oct 10, 2023',
    created_at: new Date('2023-10-10T08:00:00Z').toISOString(),
    updated_at: new Date('2023-10-10T08:00:00Z').toISOString()
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    employee_id: '00000000-0000-0000-0000-000000000001',
    cycle_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Increase Q4 Inbound Lead Generation by 25%',
    thrust_area: 'strategic',
    description: 'Execute multi-channel campaigns targeting mid-market SaaS accounts. Includes launching two technical webinars and a LinkedIn sprint.',
    uom: 'numeric',
    target: '1,200 MQLs',
    weightage: 25,
    status: 'Pending Review',
    locked: false,
    last_updated: 'Oct 12, 2023',
    created_at: new Date('2023-10-12T08:00:00Z').toISOString(),
    updated_at: new Date('2023-10-12T08:00:00Z').toISOString()
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    employee_id: '00000000-0000-0000-0000-000000000001',
    cycle_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Complete Advanced SEO Certification',
    thrust_area: 'growth',
    description: 'Complete the comprehensive SEO optimization course to bring in-house technical auditing skills to standard.',
    uom: 'binary',
    target: 'Certificate Uploaded',
    weightage: 15,
    status: 'Pending Review',
    locked: false,
    last_updated: 'Oct 12, 2023',
    created_at: new Date('2023-10-12T09:00:00Z').toISOString(),
    updated_at: new Date('2023-10-12T09:00:00Z').toISOString()
  }
];

const initialAchievements: MockAchievement[] = [
  {
    id: 'ach1',
    goal_id: '11111111-1111-1111-1111-111111111111',
    q1: 40,
    q2: 65,
    q3: 85,
    q4: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ach2',
    goal_id: '22222222-2222-2222-2222-222222222222',
    q1: 40,
    q2: 40,
    q3: 40,
    q4: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ach3',
    goal_id: '33333333-3333-3333-3333-333333333333',
    q1: 0,
    q2: 0,
    q3: 100,
    q4: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialComments: MockComment[] = [
  {
    id: 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    goal_id: '44444444-4444-4444-4444-444444444444',
    user_id: '00000000-0000-0000-0000-000000000003',
    text: 'Is 25% aggressive enough given the new budget? Let\'s discuss.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
    goal_id: '44444444-4444-4444-4444-444444444444',
    user_id: '00000000-0000-0000-0000-000000000001',
    text: 'I factored in the holiday slump, but we can stretch to 30% if we push the webinar budget.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

const initialAuditLogs: MockAuditLog[] = [
  {
    id: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    actor: 'Manager View',
    action: 'Approved FY24 goals for Sarah Jenkins.',
    timestamp: 'Today, 09:41 AM',
    type: 'success',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
    actor: 'Sarah Jenkins',
    action: 'Submitted Q1 achievements for Increase Cloud Infrastructure Uptime.',
    timestamp: 'Yesterday, 14:22 PM',
    type: 'info',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3',
    actor: 'System',
    action: 'Automatically locked employee draft submissions for FY24 cycle.',
    timestamp: 'Oct 12, 12:00 AM',
    type: 'warning',
    created_at: new Date('2023-10-12T00:00:00Z').toISOString()
  },
  {
    id: 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4',
    actor: 'Admin User',
    action: 'Initiated FY24 Corporate Objective Cycle alignment.',
    timestamp: 'Oct 01, 09:00 AM',
    type: 'info',
    created_at: new Date('2023-10-01T09:00:00Z').toISOString()
  },
  {
    id: 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5',
    actor: 'Michael Chen',
    action: 'Created 3 new objective drafts.',
    timestamp: 'Sep 28, 11:15 AM',
    type: 'info',
    created_at: new Date('2023-09-28T11:15:00Z').toISOString()
  }
];

// Helper to get global state (browser or server-fallback)
const getGlobalState = (): Record<string, any> => {
  if (typeof window !== 'undefined') {
    return (window as any).__mockDbState || ((window as any).__mockDbState = {});
  }
  return (global as any).__mockDbState || ((global as any).__mockDbState = {});
};

export const getMockData = (table: string): any[] => {
  // In Browser, prioritize localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`gs_db_${table}`);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Use global memory fallback
  const state = getGlobalState();
  if (state[table]) {
    return state[table];
  }

  // Default seeds
  let seeds: any[] = [];
  if (table === 'users') seeds = initialUsers;
  else if (table === 'cycles') seeds = initialCycles;
  else if (table === 'goals') seeds = initialGoals;
  else if (table === 'achievements') seeds = initialAchievements;
  else if (table === 'comments') seeds = initialComments;
  else if (table === 'audit_logs') seeds = initialAuditLogs;

  state[table] = seeds;
  if (typeof window !== 'undefined') {
    localStorage.setItem(`gs_db_${table}`, JSON.stringify(seeds));
  }
  return seeds;
};

export const saveMockData = (table: string, data: any[]) => {
  const state = getGlobalState();
  state[table] = data;

  if (typeof window !== 'undefined') {
    localStorage.setItem(`gs_db_${table}`, JSON.stringify(data));
    // Trigger custom event to notify other browser contexts if needed
    window.dispatchEvent(new Event('mock_db_update'));
  }
};
