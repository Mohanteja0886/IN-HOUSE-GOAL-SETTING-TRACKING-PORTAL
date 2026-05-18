'use client';

import { useState } from 'react';
import { useAuth, mockUsers } from '../../../context/AuthContext';
import { useGoals } from '../../../context/GoalContext';
import Link from 'next/link';
import { Goal } from '../../../types';
import { calculateGoalProgress, calculateOverallProgress } from '../../../../lib/utils/progress';

export default function EmployeeDashboard() {
  const { user, allUsers, isLoading: authLoading } = useAuth();
  const { goals, addComment, logQuarterProgress, updateGoalStatus, isLoading: goalsLoading } = useGoals();
  
  // Modals state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  // Log Achievement form state
  const [logGoalId, setLogGoalId] = useState('');
  const [logQuarter, setLogQuarter] = useState('Q3');
  const [logValue, setLogValue] = useState('');
  const [logStatus, setLogStatus] = useState('On Track');
  const [logNotes, setLogNotes] = useState('');
  
  // Live comment state for the details modal
  const [newCommentText, setNewCommentText] = useState('');

  if (authLoading || goalsLoading) {
    return (
      <div className="md:pl-64 pt-24 min-h-screen max-w-full overflow-x-hidden flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-primary tracking-wide">Synchronizing live portal data...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const myGoals = goals.filter(g => g.employeeId === user.id);
  const topGoal = myGoals[0];
  const restGoals = myGoals.slice(1);

  const aggregateProgress = calculateOverallProgress(myGoals, 'Q3');

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !newCommentText.trim()) return;

    await addComment(selectedGoal.id, user.id, newCommentText.trim());
    setNewCommentText('');
    
    // Refresh modal focus reference from latest updated goals state
    const latestGoal = goals.find(g => g.id === selectedGoal.id);
    if (latestGoal) {
      setSelectedGoal(latestGoal);
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logGoalId || !logValue.trim()) return;

    const targetGoal = myGoals.find(g => g.id === logGoalId);
    if (targetGoal) {
      const numericVal = parseInt(logValue);
      if (isNaN(numericVal)) return;

      // Update achievements database table
      await logQuarterProgress(logGoalId, logQuarter as any, numericVal);

      // Update trajectory status as requested
      await updateGoalStatus(logGoalId, logStatus as any);

      // Append check-in verification comment
      const achievementComment = `[Achievement Check-in - ${logQuarter}] Logged actual achievement of ${logValue}%. Trajectory: ${logStatus}. Notes: ${logNotes.trim() || 'None'}`;
      await addComment(logGoalId, user.id, achievementComment);
      
      // Reset form
      setLogGoalId('');
      setLogValue('');
      setLogStatus('On Track');
      setLogNotes('');
      setIsLogModalOpen(false);
      
      alert('Achievement and status logged successfully! Progress comment appended to objectives sheet.');
    }
  };

  const openDetailsModal = (goal: Goal) => {
    // Fetch latest instance to make sure comments match latest state
    const latest = goals.find(g => g.id === goal.id);
    if (latest) {
      setSelectedGoal(latest);
    }
  };


  return (
    <main className="md:pl-64 pt-24 pb-8 min-h-screen max-w-full overflow-x-hidden flex-grow">
      <div className="p-6 md:p-8 max-w-[1280px] mx-auto flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="font-headline-lg text-primary text-3xl font-bold">Objectives Overview</h1>
            <p className="text-on-surface-variant font-body-md mt-1">
              Analyze goal cycle trajectory, submit performance drafts, and log achievement check-ins.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/employee/goals/new" 
              className="px-4 py-2 rounded-xl bg-surface-container-high text-primary font-label-md font-bold border border-outline-variant hover:bg-surface-variant transition-colors flex items-center gap-2 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              New Goal Sheet
            </Link>
            <button 
              onClick={() => {
                if (myGoals.length > 0) {
                  setLogGoalId(myGoals[0].id);
                }
                setIsLogModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold hover:opacity-90 transition-opacity flex items-center gap-2 text-xs cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">emoji_events</span>
              Log Achievement
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Active Goals Grid */}
          <section className="xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-4 z-10">
              <div className="flex items-center gap-2">
                <h2 className="font-title-lg text-primary font-bold text-base">Active Performance Cycles</h2>
                <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {myGoals.length} Active
                </span>
              </div>
              <span className="text-xs text-outline font-semibold">
                Overall Cycle Completion: {aggregateProgress}%
              </span>
            </div>

            <div className="flex flex-col gap-6 z-10">
              {topGoal && (
                <div 
                  onClick={() => openDetailsModal(topGoal)} 
                  className="group cursor-pointer p-4 bg-surface-container-low border border-transparent hover:border-outline rounded-xl transition-all shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-3 gap-2">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#e8f5e9] text-[#2e7d32] mb-1.5 uppercase">
                        Primary Key Objective
                      </span>
                      <h3 className="font-semibold text-primary text-base group-hover:text-primary-fixed-dim transition-colors leading-tight">
                        {topGoal.title}
                      </h3>
                      <p className="text-xs font-body-md text-on-surface-variant mt-1.5 line-clamp-2">
                        {topGoal.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1 uppercase tracking-wider ${
                        topGoal.status === 'On Track' ? 'bg-[#e8f5e9] text-[#2e7d32]' : 
                        topGoal.status === 'Behind' ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface'
                      }`}>
                        {topGoal.status}
                      </span>
                      <span className="font-bold text-primary text-lg">
                        {calculateGoalProgress(topGoal, 'Q3')}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        topGoal.status === 'Behind' ? 'bg-[#ff9800]' : 
                        topGoal.status === 'Completed' ? 'bg-[#4caf50]' : 'bg-primary'
                      }`} 
                      style={{ width: `${calculateGoalProgress(topGoal, 'Q3')}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <hr className="border-outline-variant/30" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {restGoals.map(goal => {
                  const progressPercent = calculateGoalProgress(goal, 'Q3');

                  return (
                    <div 
                      key={goal.id} 
                      onClick={() => openDetailsModal(goal)}
                      className="cursor-pointer group p-3.5 bg-surface/40 hover:bg-surface-container-low border border-outline-variant/20 hover:border-outline rounded-xl transition-all"
                    >
                      <div className="flex justify-between items-start mb-2.5 gap-2">
                        <h3 className="font-semibold text-primary text-sm group-hover:text-primary-fixed-dim transition-colors truncate pr-2 leading-snug">
                          {goal.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          goal.status === 'Behind' ? 'bg-[#fff3e0] text-[#e65100]' :
                          goal.status === 'Completed' ? 'bg-[#e8f5e9] text-[#2e7d32]' :
                          goal.status === 'On Track' ? 'bg-[#e8f5e9] text-[#2e7d32]' :
                          'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {goal.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              goal.status === 'Behind' ? 'bg-[#ff9800]' : 
                              goal.status === 'Completed' ? 'bg-[#4caf50]' : 'bg-primary'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant w-8 text-right shrink-0">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                  );
                })}

                {!restGoals.length && (
                  <div className="text-on-surface-variant font-body-md text-sm py-4 col-span-2 text-center opacity-60">
                    No secondary active objectives registered in system.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right Schedules Sidebar */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <section className="bg-primary-container text-on-primary-container rounded-2xl p-6 shadow-sm border border-primary-fixed-dim relative overflow-hidden">
              <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[120px] text-on-primary-container opacity-5 pointer-events-none">
                event_upcoming
              </span>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                </div>
                <h2 className="font-semibold text-base leading-none">Review Check-ins</h2>
              </div>
              <div className="relative z-10 bg-surface-container-lowest/15 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/20 mt-2">
                <p className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider mb-1">
                  Active Review Window
                </p>
                <p className="font-bold text-white text-base leading-tight">
                  FY24 Objective Cycle:<br />Open for Alignment
                </p>
                <Link 
                  href="/employee/goals/new"
                  className="mt-5 block w-full py-2.5 bg-primary-fixed text-on-primary-fixed rounded-xl font-label-md font-bold hover:bg-white transition-colors text-center text-xs shadow-sm"
                >
                  Configure Goal Drafts
                </Link>
              </div>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
              <h2 className="font-title-lg text-primary font-bold text-base border-b border-surface-container-high pb-4 mb-4">
                Organizational Focus
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low border border-transparent hover:border-outline-variant transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary leading-tight">Technical Mastery</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-1">
                      Professional Certification objectives
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low border border-transparent hover:border-outline-variant transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">handshake</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary leading-tight">Customer Obsession</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-1">
                      Uptime, stability, and growth alignments
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Modal: Goal Details & Discussion board */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-lg rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3 mb-4 shrink-0">
              <div>
                <span className="bg-surface-container-high text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {selectedGoal.thrustArea}
                </span>
                <h3 className="font-headline-sm text-primary font-bold text-lg mt-1">{selectedGoal.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedGoal(null)}
                className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-1 transition-colors ml-2"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto pr-1 flex-grow space-y-5 my-2">
              <div>
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Objective Strategy</h4>
                <p className="text-sm text-on-surface leading-relaxed mt-1">{selectedGoal.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
                <div>
                  <h4 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Target Objective Metric</h4>
                  <p className="text-sm font-bold text-primary mt-0.5">{selectedGoal.target}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Cycle Weightage</h4>
                  <p className="text-sm font-bold text-primary mt-0.5">{selectedGoal.weightage}%</p>
                </div>
              </div>

              {/* Discussion Thread */}
              <div>
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2.5">
                  Manager Collaboration & Alignment History
                </h4>
                
                <div className="space-y-3 bg-surface rounded-xl p-3.5 border border-outline-variant max-h-52 overflow-y-auto">
                  {selectedGoal.comments.length === 0 ? (
                    <p className="text-xs text-outline italic text-center py-4">
                      No team alignment messages have been exchanged yet.
                    </p>
                  ) : (
                    selectedGoal.comments.map(c => {
                      const commentAuthor = allUsers.find(u => u.id === c.userId) || mockUsers.find(u => u.id === c.userId);
                      const isMe = c.userId === user.id;
                      return (
                        <div key={c.id} className="flex gap-2.5 items-start text-xs border-b border-outline-variant/10 pb-2.5 last:border-0 last:pb-0">
                          <img 
                            src={commentAuthor?.avatar} 
                            alt={commentAuthor?.name} 
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span className={`font-bold ${isMe ? 'text-primary' : 'text-secondary'}`}>
                                {commentAuthor?.name}
                              </span>
                              <span className="text-[9px] text-outline">{c.createdAt}</span>
                            </div>
                            <p className="text-on-surface-variant leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="border-t border-outline-variant pt-4 mt-2 shrink-0">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Ask a question or report status..."
                  className="w-full bg-surface border border-outline rounded-xl py-2.5 pl-4 pr-12 text-sm text-on-surface focus:border-primary outline-none"
                />
                <button 
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="absolute right-2 text-primary hover:opacity-85 disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] p-1">send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Achievement Progress */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-primary font-bold text-lg">Log Target Progress Achievement</h3>
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Target Key Objective</label>
                <select 
                  value={logGoalId} 
                  onChange={(e) => setLogGoalId(e.target.value)}
                  required
                  className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  {myGoals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                  {!myGoals.length && (
                    <option disabled value="">No active objectives to select</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Review Quarter</label>
                  <select 
                    value={logQuarter}
                    onChange={(e) => setLogQuarter(e.target.value)}
                    className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    <option value="Q1">Q1 Performance</option>
                    <option value="Q2">Q2 Performance</option>
                    <option value="Q3">Q3 Performance</option>
                    <option value="Q4">Q4 Performance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Progress Reached (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={logValue}
                    onChange={(e) => setLogValue(e.target.value)}
                    placeholder="e.g. 85"
                    required
                    className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Goal Trajectory Status</label>
                <select 
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value)}
                  className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="On Track">On Track</option>
                  <option value="Behind">Behind</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Achievement Verification Notes</label>
                <textarea 
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Detail specific metrics completed, uploads, or criteria verification reached..."
                  rows={3}
                  className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 border border-outline rounded-lg text-xs font-bold hover:bg-surface-container-low text-on-surface"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!logGoalId}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  Submit Achievement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
