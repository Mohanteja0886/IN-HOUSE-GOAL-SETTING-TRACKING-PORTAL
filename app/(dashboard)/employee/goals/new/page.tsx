'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useGoals } from '../../../../context/GoalContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UoM } from '../../../../types';

interface GoalInput {
  id: number;
  thrustArea: string;
  title: string;
  description: string;
  uom: UoM;
  target: string;
  weightage: number;
}

const defaultGoal = (): GoalInput => ({
  id: Date.now(),
  thrustArea: '',
  title: '',
  description: '',
  uom: 'numeric',
  target: '',
  weightage: 0
});

export default function CreateGoals() {
  const { user } = useAuth();
  const { addGoal } = useGoals();
  const router = useRouter();
  
  const [goals, setGoals] = useState<GoalInput[]>([
    { id: 1, thrustArea: '', title: '', description: '', uom: 'numeric', target: '', weightage: 0 }
  ]);

  // Load saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('goalstream_draft_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGoals(parsed);
        }
      } catch (err) {
        console.error('Failed to parse draft goals', err);
      }
    }
  }, []);

  const totalWeightage = useMemo(() => {
    return goals.reduce((acc, curr) => acc + (Number(curr.weightage) || 0), 0);
  }, [goals]);

  if (!user) return null;

  const handleUpdateGoal = <K extends keyof GoalInput>(
    id: number,
    field: K,
    value: GoalInput[K]
  ) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const addAnotherGoal = () => {
    if (goals.length < 8) {
      setGoals(prev => [...prev, defaultGoal()]);
    }
  };

  const handleRemoveGoal = (id: number) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleSaveDraft = () => {
    localStorage.setItem('goalstream_draft_goals', JSON.stringify(goals));
    alert('Progress saved to draft storage. You can continue configuring your objective sheet anytime.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeightage !== 100) return;
    
    // Enforce 10% minimum weightage per individual goal
    const hasUnderweightGoal = goals.some(g => (Number(g.weightage) || 0) < 10);
    if (hasUnderweightGoal) {
      alert("Validation Error: Each individual goal must have a minimum weightage of 10%. Please review your objective allocations.");
      return;
    }
    
    // Deploy each validated objective draft in parallel to Supabase
    const promises = goals
      .filter(g => g.title.trim())
      .map(g =>
        addGoal({
          employeeId: user.id,
          title: g.title.trim(),
          thrustArea: g.thrustArea || 'strategic',
          description: g.description.trim() || 'No additional details provided.',
          uom: g.uom,
          target: g.target.trim() || '100',
          weightage: Number(g.weightage),
        })
      );

    await Promise.all(promises);

    // Clear saved drafts upon successful submission
    localStorage.removeItem('goalstream_draft_goals');
    router.push('/employee/dashboard');
  };


  return (
    <main className="md:pl-64 pt-24 pb-8 px-4 md:px-8 min-h-screen flex-grow">
      <div className="max-w-[1000px] mx-auto p-6 md:p-8 pb-36">
        <div className="mb-8">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md mb-3 text-xs">
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <Link href="/employee/dashboard" className="hover:text-primary transition-colors font-bold">
              Back to Overview
            </Link>
          </div>
          <h1 className="font-headline-lg text-primary text-3xl font-bold mb-2">Create FY24 Objectives Sheet</h1>
          <p className="text-on-surface-variant font-body-md leading-relaxed text-sm max-w-3xl">
            Configure your strategic alignment targets for this corporate cycle. Allocate exactly 100% total weightage across a maximum of 8 objective drafts. Submitted sheets are forwarded for manager audit.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {goals.map((goal, index) => (
            <div key={goal.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm relative group transition-all hover:border-outline">
              <div className="bg-surface-container-low/50 px-6 py-3.5 border-b border-outline-variant flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">drag_indicator</span>
                  <h3 className="font-semibold text-primary text-sm uppercase tracking-wide">
                    Objective {(index + 1).toString().padStart(2, '0')}
                  </h3>
                </div>
                {goals.length > 1 && (
                  <button 
                    onClick={() => handleRemoveGoal(goal.id)} 
                    className="text-error hover:bg-error-container hover:text-on-error-container p-1.5 rounded-lg transition-colors flex items-center cursor-pointer" 
                    type="button"
                    title="Delete goal"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
              
              <div className="p-6 grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Strategic Focus Area</label>
                  <div className="relative">
                    <select 
                      value={goal.thrustArea} 
                      onChange={e => handleUpdateGoal(goal.id, 'thrustArea', e.target.value)} 
                      required
                      className="w-full appearance-none bg-surface border border-outline rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-10"
                    >
                      <option disabled value="">Select Category</option>
                      <option value="growth">Growth & Revenue</option>
                      <option value="stability">Operational Stability</option>
                      <option value="culture">Team & Culture</option>
                      <option value="strategic">Strategic Focus</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
                
                <div className="col-span-12 md:col-span-8">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Objective Title</label>
                  <input 
                    value={goal.title} 
                    onChange={e => handleUpdateGoal(goal.id, 'title', e.target.value)} 
                    required
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="e.g. Optimize Cloud Platform Infrastructure latency levels" 
                    type="text" 
                  />
                </div>
                
                <div className="col-span-12">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Description & Measurement Criteria</label>
                  <textarea 
                    value={goal.description} 
                    onChange={e => handleUpdateGoal(goal.id, 'description', e.target.value)} 
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" 
                    placeholder="Outline targeted milestones, quality thresholds, and delivery timelines..." 
                    rows={3} 
                  />
                </div>
                
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Unit of Measure (UoM)</label>
                  <div className="relative">
                    <select 
                      value={goal.uom} 
                      onChange={e => handleUpdateGoal(goal.id, 'uom', e.target.value as UoM)} 
                      className="w-full appearance-none bg-surface border border-outline rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-10"
                    >
                      <option value="numeric">Numeric Metric</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="timeline">Target Date</option>
                      <option value="binary">Binary (Yes/No)</option>
                      <option value="zero-based">Zero-based (Zero = Success)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
                
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Target Metric Value</label>
                  <input 
                    value={goal.target} 
                    onChange={e => handleUpdateGoal(goal.id, 'target', e.target.value)} 
                    required
                    className="w-full bg-surface border border-outline rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder={goal.uom === 'numeric' ? 'e.g. 50000' : goal.uom === 'percentage' ? 'e.g. 99' : 'e.g. Completed'} 
                    type="text" 
                  />
                </div>
                
                <div className="col-span-12 md:col-span-4 relative">
                  <label className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant mb-2">
                    Cycle Weightage (%)
                    <div className="relative group/tooltip flex items-center justify-center cursor-help">
                      <span className="material-symbols-outlined text-[15px] text-outline">info</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-inverse-surface text-inverse-on-surface text-[10px] leading-tight rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                        Minimum 10% weightage is strictly required per goal. Sum total must equal exactly 100%.
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <input 
                      value={goal.weightage || ''} 
                      onChange={e => handleUpdateGoal(goal.id, 'weightage', Number(e.target.value))} 
                      required
                      className={`w-full bg-surface border rounded-lg pl-4 pr-10 py-2.5 font-body-md text-sm text-on-surface focus:ring-1 outline-none transition-all text-right font-bold ${
                        goal.weightage > 0 && goal.weightage < 10 ? 'border-error focus:border-error focus:ring-error' : 'border-outline focus:border-primary focus:ring-primary'
                      }`} 
                      type="number" 
                      min="0" 
                      max="100" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-semibold pointer-events-none">
                      %
                    </span>
                  </div>
                  {goal.weightage > 0 && goal.weightage < 10 && (
                    <span className="text-[10px] text-error font-bold mt-1 block animate-pulse">Minimum 10% weightage required.</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {goals.length < 8 && (
            <button 
              onClick={addAnotherGoal} 
              className="w-full border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-lowest hover:bg-surface-container-low text-primary font-label-md py-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Objective Alignment ({goals.length + 1} of 8)
            </button>
          )}
        </form>
      </div>

      {/* Floating Status & Submit Banner */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-surface-container-lowest border-t border-outline-variant shadow-md z-30 p-4 px-6 md:px-8">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Allocation Sum</span>
              <div className="flex items-baseline gap-1">
                <span className={`font-headline-md text-xl font-black ${totalWeightage === 100 ? 'text-[#2e7d32]' : 'text-on-surface'}`}>
                  {totalWeightage}%
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">/ 100%</span>
              </div>
            </div>
            <div className="flex-1 sm:w-48 h-2 bg-surface-container-high rounded-full overflow-hidden shrink-0">
              <div 
                className={`h-full transition-all duration-300 ${totalWeightage === 100 ? 'bg-[#4caf50]' : totalWeightage > 100 ? 'bg-error' : 'bg-primary'}`} 
                style={{ width: `${Math.min(100, Math.max(0, totalWeightage))}%` }}
              ></div>
            </div>
            {totalWeightage !== 100 && (
              <div className="relative group/tooltip flex items-center justify-center cursor-help ml-1">
                <span className={`material-symbols-outlined text-[18px] ${totalWeightage > 100 ? 'text-error' : 'text-outline'}`}>
                  error
                </span>
                <div className="absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-52 p-2 bg-inverse-surface text-inverse-on-surface text-[10px] leading-tight rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                  Objective sum must equal exactly 100% to permit submission.
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={handleSaveDraft}
              className="px-5 py-2.5 rounded-xl font-label-md font-bold text-xs bg-surface-container-high text-primary hover:bg-surface-variant transition-all cursor-pointer" 
              type="button"
            >
              Save Draft Sheet
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={totalWeightage !== 100 || goals.some(g => (Number(g.weightage) || 0) < 10)} 
              className="px-5 py-2.5 rounded-xl font-label-md font-bold text-xs bg-primary text-on-primary disabled:opacity-55 disabled:cursor-not-allowed hover:opacity-90 flex items-center gap-2 transition-all cursor-pointer shadow-sm" 
              type="button"
            >
              Submit for Approval
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
