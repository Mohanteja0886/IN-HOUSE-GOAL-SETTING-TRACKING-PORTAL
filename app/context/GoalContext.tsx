'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Goal } from '../types';
import { useAuth } from './AuthContext';
import { 
  fetchGoals, 
  createGoal, 
  updateGoalStatusAndLock, 
  updateGoalWeightage as updateWeightageQuery, 
  updateGoalTarget as updateTargetQuery,
  updateQuarterlyAchievement
} from '../../lib/queries/goals';
import { addGoalComment } from '../../lib/queries/comments';
import { writeAuditLog } from '../../lib/queries/auditLogs';

interface GoalContextType {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (goal: Omit<Goal, 'id' | 'status' | 'lastUpdated' | 'comments'> & { isShared?: boolean; sharedFrom?: string }) => Promise<void>;
  updateGoalStatus: (id: string, status: Goal['status']) => Promise<void>;
  getGoalsByEmployee: (empId: string) => Goal[];
  addComment: (goalId: string, userId: string, text: string) => Promise<void>;
  updateGoalWeightage: (goalId: string, weightage: number) => Promise<void>;
  updateGoalTarget: (goalId: string, target: string) => Promise<void>;
  logQuarterProgress: (goalId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', value: number) => Promise<void>;
  resetGoals: () => void;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadAllGoals() {
    setIsLoading(true);
    try {
      const data = await fetchGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadAllGoals();
    } else {
      setGoals([]);
      setIsLoading(false);
    }
  }, [user]);

  const addGoal = async (goalData: Omit<Goal, 'id' | 'status' | 'lastUpdated' | 'comments'> & { isShared?: boolean; sharedFrom?: string }) => {
    try {
      const newGoal = await createGoal(goalData);
      if (newGoal) {
        setGoals(prev => [newGoal, ...prev]);
        await writeAuditLog(
          user?.name || 'System',
          goalData.isShared 
            ? `Pushed departmental shared goal: "${goalData.title}".`
            : `Created and submitted new goal: "${goalData.title}".`,
          'info'
        );
      }
    } catch (err) {
      console.error('Error adding goal context:', err);
    }
  };

  const updateGoalStatus = async (id: string, status: Goal['status']) => {
    try {
      const isLocked = status === 'Locked';
      const success = await updateGoalStatusAndLock(id, status, isLocked);
      if (success) {
        setGoals(prev =>
          prev.map(g => (g.id === id ? { ...g, status, lastUpdated: 'Just now' } : g))
        );
        
        const targetGoal = goals.find(g => g.id === id);
        await writeAuditLog(
          user?.name || 'System',
          `Updated goal status to "${status}" for: "${targetGoal?.title || id}".`,
          status === 'Locked' ? 'success' : 'warning'
        );
      }
    } catch (err) {
      console.error('Error updating goal status context:', err);
    }
  };

  const getGoalsByEmployee = (empId: string) => {
    // Map static employee IDs to real seeded UUIDs if necessary
    const staticMap: Record<string, string> = {
      'emp1': '00000000-0000-0000-0000-000000000001',
      'emp2': '00000000-0000-0000-0000-000000000002'
    };
    const realId = staticMap[empId] || empId;
    return goals.filter(g => g.employeeId === realId);
  };

  const addComment = async (goalId: string, userId: string, text: string) => {
    try {
      const success = await addGoalComment(goalId, userId, text);
      if (success) {
        const newComment = {
          id: `c_${Date.now()}`,
          userId,
          text,
          createdAt: 'Just now'
        };
        setGoals(prev =>
          prev.map(g => (g.id === goalId ? { ...g, comments: [...g.comments, newComment], lastUpdated: 'Just now' } : g))
        );
      }
    } catch (err) {
      console.error('Error adding comment context:', err);
    }
  };

  const updateGoalWeightage = async (goalId: string, weightage: number) => {
    try {
      const success = await updateWeightageQuery(goalId, weightage);
      if (success) {
        setGoals(prev =>
          prev.map(g => (g.id === goalId ? { ...g, weightage, lastUpdated: 'Just now' } : g))
        );
      }
    } catch (err) {
      console.error('Error updating weightage context:', err);
    }
  };

  const updateGoalTarget = async (goalId: string, target: string) => {
    try {
      const success = await updateTargetQuery(goalId, target);
      if (success) {
        setGoals(prev =>
          prev.map(g => (g.id === goalId ? { ...g, target, lastUpdated: 'Just now' } : g))
        );
      }
    } catch (err) {
      console.error('Error updating target context:', err);
    }
  };

  const logQuarterProgress = async (goalId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', value: number) => {
    try {
      const success = await updateQuarterlyAchievement(goalId, quarter, value);
      if (success) {
        setGoals(prev =>
          prev.map(g => {
            if (g.id === goalId) {
              const currentAchs = g.achievements || { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
              return {
                ...g,
                lastUpdated: 'Just now',
                achievements: {
                  ...currentAchs,
                  [quarter]: value
                }
              };
            }
            return g;
          })
        );
      }
    } catch (err) {
      console.error('Error logging quarter progress context:', err);
    }
  };

  const resetGoals = () => {
    loadAllGoals();
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        isLoading,
        addGoal,
        updateGoalStatus,
        getGoalsByEmployee,
        addComment,
        updateGoalWeightage,
        updateGoalTarget,
        logQuarterProgress,
        resetGoals
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};
