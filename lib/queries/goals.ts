import { createClient } from '../supabase/client';
import { Goal, GoalStatus } from '../../app/types';

export async function fetchGoals(): Promise<Goal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .select(`
      id,
      employee_id,
      cycle_id,
      title,
      thrust_area,
      description,
      uom,
      target,
      weightage,
      status,
      locked,
      last_updated,
      achievements (
        q1, q2, q3, q4
      ),
      comments (
        id,
        user_id,
        text,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  const resolvedGoals: Goal[] = (data || []).map((g: any) => {
    const achs = g.achievements;
    const achObj = Array.isArray(achs) ? achs[0] : achs;
    
    const commentsList = (g.comments || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      text: c.text,
      createdAt: new Date(c.created_at).toLocaleDateString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    let isShared = false;
    let sharedFrom = undefined;
    let parsedDescription = g.description;

    if (g.description.startsWith('[SHARED_GOAL:')) {
      const match = g.description.match(/^\[SHARED_GOAL:(.*?)\]\s*(.*)$/);
      if (match) {
        isShared = true;
        sharedFrom = match[1];
        parsedDescription = match[2];
      }
    }

    return {
      id: g.id,
      employeeId: g.employee_id,
      title: g.title,
      thrustArea: g.thrust_area,
      description: parsedDescription,
      uom: g.uom as Goal['uom'],
      target: g.target,
      weightage: g.weightage,
      status: g.status as GoalStatus,
      lastUpdated: g.last_updated,
      comments: commentsList,
      achievements: achObj ? {
        Q1: achObj.q1,
        Q2: achObj.q2,
        Q3: achObj.q3,
        Q4: achObj.q4
      } : { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
      isShared,
      sharedFrom
    };
  });

  // Dynamically sync achievements, title, and target from the parent goal for shared goals
  resolvedGoals.forEach(g => {
    if (g.isShared && g.sharedFrom) {
      const parent = resolvedGoals.find(p => p.id === g.sharedFrom);
      if (parent) {
        g.achievements = parent.achievements;
        g.target = parent.target;
        g.title = parent.title;
      }
    }
  });

  return resolvedGoals;
}

export async function createGoal(
  goalData: Omit<Goal, 'id' | 'status' | 'lastUpdated' | 'comments'> & { isShared?: boolean; sharedFrom?: string }
): Promise<Goal | null> {
  const supabase = createClient();
  
  let finalDescription = goalData.description;
  if (goalData.isShared && goalData.sharedFrom) {
    finalDescription = `[SHARED_GOAL:${goalData.sharedFrom}] ${goalData.description}`;
  }
  
  // Insert goal record
  const { data: goalRow, error: goalError } = await supabase
    .from('goals')
    .insert({
      employee_id: goalData.employeeId,
      title: goalData.title,
      thrust_area: goalData.thrustArea,
      description: finalDescription,
      uom: goalData.uom,
      target: goalData.target,
      weightage: goalData.weightage,
      status: goalData.isShared ? 'Locked' : 'Submitted', // Pushed departmental goals are locked
      locked: goalData.isShared ? true : false,
      last_updated: 'Just now'
    })
    .select()
    .single();

  if (goalError || !goalRow) {
    console.error('Error inserting goal:', goalError);
    return null;
  }

  // Automatically initialize corresponding blank quarterly achievements scorecard
  const { error: achError } = await supabase
    .from('achievements')
    .insert({
      goal_id: goalRow.id,
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0
    });

  if (achError) {
    console.error('Error initializing achievements:', achError);
  }

  let isShared = false;
  let sharedFrom = undefined;
  let parsedDescription = goalRow.description;

  if (goalRow.description.startsWith('[SHARED_GOAL:')) {
    const match = goalRow.description.match(/^\[SHARED_GOAL:(.*?)\]\s*(.*)$/);
    if (match) {
      isShared = true;
      sharedFrom = match[1];
      parsedDescription = match[2];
    }
  }

  return {
    id: goalRow.id,
    employeeId: goalRow.employee_id,
    title: goalRow.title,
    thrustArea: goalRow.thrust_area,
    description: parsedDescription,
    uom: goalRow.uom as Goal['uom'],
    target: goalRow.target,
    weightage: goalRow.weightage,
    status: goalRow.status as GoalStatus,
    lastUpdated: goalRow.last_updated,
    comments: [],
    achievements: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    isShared,
    sharedFrom
  };
}

export async function updateGoalStatusAndLock(
  goalId: string,
  status: GoalStatus,
  locked: boolean
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('goals')
    .update({ 
      status, 
      locked,
      last_updated: 'Just now'
    })
    .eq('id', goalId);

  if (error) {
    console.error('Error updating goal status and lock state:', error);
    return false;
  }

  return true;
}

export async function updateGoalWeightage(goalId: string, weightage: number): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('goals')
    .update({ 
      weightage,
      last_updated: 'Just now'
    })
    .eq('id', goalId);

  if (error) {
    console.error('Error updating goal weightage:', error);
    return false;
  }

  return true;
}

export async function updateGoalTarget(goalId: string, target: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('goals')
    .update({ 
      target,
      last_updated: 'Just now'
    })
    .eq('id', goalId);

  if (error) {
    console.error('Error updating goal target:', error);
    return false;
  }

  return true;
}

export async function updateQuarterlyAchievement(
  goalId: string,
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  value: number
): Promise<boolean> {
  const supabase = createClient();
  const colName = quarter.toLowerCase(); // 'q1', 'q2', 'q3', 'q4'

  const { data: existing } = await supabase
    .from('achievements')
    .select('id')
    .eq('goal_id', goalId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('achievements')
      .update({ [colName]: value })
      .eq('goal_id', goalId);

    if (error) {
      console.error('Error updating achievements:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('achievements')
      .insert({
        goal_id: goalId,
        [colName]: value
      });

    if (error) {
      console.error('Error inserting achievements:', error);
      return false;
    }
  }

  return true;
}
