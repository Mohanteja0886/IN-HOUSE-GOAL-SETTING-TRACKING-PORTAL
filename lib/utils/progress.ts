import { Goal } from '../../app/types';

/**
 * Computes the progress percentage for a goal in a given quarter
 * based on the UoM Type formulas in the ATOMQUEST HACKATHON 1.0 document.
 */
export function calculateGoalProgress(goal: Goal, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): number {
  const achievements = goal.achievements || { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  const val = achievements[quarter] || 0;

  if (goal.status === 'Completed') return 100;

  // Clean the target string to get the numerical target
  // e.g. "99.99%" -> 99.99, "1,200 MQLs" -> 1200, "0" -> 0
  const targetStr = goal.target.replace(/,/g, '').replace(/[^0-9.]/g, '');
  const targetNum = parseFloat(targetStr);

  // 1. Zero-based (Zero = Success, e.g. Safety incidents)
  // Formula: If 0 -> 100%, else 0%
  if (goal.uom === 'zero-based' || (goal.uom === 'binary' && (goal.target === '0' || goal.target.toLowerCase().includes('zero')))) {
    return val === 0 ? 100 : 0;
  }

  // 2. Binary / Yes-No (e.g. Certifications)
  if (goal.uom === 'binary') {
    return val >= 100 || val === 1 ? 100 : 0;
  }

  // 3. Timeline (Date-based completion)
  // If val is 100 or 1, it is fully met. Otherwise it returns the logged percentage.
  if (goal.uom === 'timeline') {
    return val >= 100 || val === 1 ? 100 : val;
  }

  // 4. Max (Numeric / %) - Lower is better (e.g. TAT, Cost, Bugs)
  // Formula: Target ÷ Achievement
  const isMaxUom = 
    goal.thrustArea === 'stability' || 
    goal.title.toLowerCase().includes('reduce') || 
    goal.title.toLowerCase().includes('bug') || 
    goal.title.toLowerCase().includes('cost') || 
    goal.title.toLowerCase().includes('tat') || 
    goal.description.toLowerCase().includes('lower is better') ||
    goal.description.toLowerCase().includes('reduce');

  if (isMaxUom && !isNaN(targetNum) && targetNum > 0) {
    if (val === 0) return 100; // Zero cost/incidents is perfect
    const ratio = targetNum / val;
    return Math.min(100, Math.round(ratio * 100));
  }

  // 5. Min (Numeric / %) - Higher is better (e.g. Sales Revenue, Uptime)
  // Formula: Achievement ÷ Target
  if (!isNaN(targetNum) && targetNum > 0) {
    const ratio = val / targetNum;
    if (goal.uom === 'percentage' || goal.target.includes('%')) {
      // If targets are stored as percentage, they might be e.g. "99.99"
      // If val is e.g. "85", then (85 / 99.99) * 100 = 85%
      return Math.min(100, Math.round(ratio * 100));
    }
    return Math.min(100, Math.round(ratio * 100));
  }

  return val;
}

/**
 * Calculates the overall aggregate progress across all goals for an employee
 * using their respective weightages.
 */
export function calculateOverallProgress(goalsList: Goal[], currentQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q3'): number {
  if (!goalsList.length) return 0;
  let totalScore = 0;
  let totalWeight = 0;

  goalsList.forEach(g => {
    const progress = calculateGoalProgress(g, currentQuarter);
    totalScore += progress * g.weightage;
    totalWeight += g.weightage;
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}
