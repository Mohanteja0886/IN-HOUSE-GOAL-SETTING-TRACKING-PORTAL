'use client';

import { Suspense, useState } from 'react';
import { useAuth, mockUsers } from '../../../context/AuthContext';
import { useGoals } from '../../../context/GoalContext';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { calculateGoalProgress } from '../../../../lib/utils/progress';

function ApprovalsContent() {
  const { user, allUsers, isLoading: authLoading } = useAuth();
  const { goals, updateGoalStatus, addComment, updateGoalWeightage, updateGoalTarget, isLoading: goalsLoading } = useGoals();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const employeeId = searchParams.get('employeeId') || 'emp1';
  
  // Resolve profile ID from seeded UUIDs or fallback mock IDs
  const staticMap: Record<string, string> = {
    'emp1': '00000000-0000-0000-0000-000000000001',
    'emp2': '00000000-0000-0000-0000-000000000002',
    'mgr1': '00000000-0000-0000-0000-000000000003',
    'admin1': '00000000-0000-0000-0000-000000000004'
  };
  const realId = staticMap[employeeId] || employeeId;

  const employee = allUsers.find(u => u.id === realId) || mockUsers.find(u => u.id === employeeId);
  const employeeGoals = goals.filter(g => g.employeeId === realId);
  
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>({});
  const [reworkFeedback, setReworkFeedback] = useState('');

  if (authLoading || goalsLoading) {
    return (
      <div className="md:pl-64 pt-24 min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-primary tracking-wide">Syncing goal sheets...</p>
        </div>
      </div>
    );
  }

  if (!user || !employee) return null;

  const totalWeightage = employeeGoals.reduce((acc, g) => acc + g.weightage, 0);

  const handleApproveAll = async () => {
    const promises = employeeGoals.map(async g => {
      await updateGoalStatus(g.id, 'Locked');
      await addComment(g.id, user.id, 'Goal sheet approved and locked for cycle.');
    });
    await Promise.all(promises);
    router.push('/manager/dashboard');
  };

  const handleReturnForRework = async () => {
    const feedbackText = reworkFeedback.trim();
    if (!feedbackText) {
      alert('Please provide specific rework feedback details before returning.');
      return;
    }

    const promises = employeeGoals.map(async g => {
      await updateGoalStatus(g.id, 'Returned');
      await addComment(g.id, user.id, `[Rework Request] ${feedbackText}`);
    });
    await Promise.all(promises);

    setReworkFeedback('');
    router.push('/manager/dashboard');
  };

  const postComment = async (goalId: string) => {
    const text = commentsMap[goalId];
    if (text && text.trim()) {
      await addComment(goalId, user.id, text.trim());
      setCommentsMap(prev => ({ ...prev, [goalId]: '' }));
    }
  };


  return (
    <main className="md:pl-64 pt-24 pb-8 px-4 md:px-8 min-h-screen flex-grow">
      <div className="max-w-[1280px] mx-auto p-6 md:p-8 pb-24 flex flex-col gap-6">
        {/* Banner Card */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-container-lowest p-6 border border-outline-variant rounded-2xl shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Link href="/manager/dashboard" className="text-on-surface-variant hover:text-primary transition-colors flex items-center">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              </Link>
              <span className="font-bold text-on-surface-variant uppercase tracking-wider">Goal Sheet Alignment Audit</span>
            </div>
            <h1 className="font-headline-lg text-primary text-3xl font-bold">{employee.name}</h1>
            <p className="text-sm font-body-md text-on-surface-variant">
              {employee.title} &bull; Submitted updates {employeeGoals[0]?.lastUpdated || 'recently'}
            </p>
          </div>
          
          <div className="flex gap-4 items-center bg-surface p-4 rounded-xl border border-outline-variant">
            <div className="flex flex-col px-4 border-r border-outline-variant">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Weightage</span>
              <span className={`text-xl font-black ${totalWeightage === 100 ? 'text-[#2e7d32]' : 'text-error'}`}>
                {totalWeightage}%
              </span>
            </div>
            <div className="flex flex-col px-4">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Goals</span>
              <span className="text-xl text-primary font-black">{employeeGoals.length}</span>
            </div>
          </div>
        </div>

        {/* Action Containers */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Return Rework Column */}
          <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
            <h3 className="font-title-lg text-primary font-bold text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">assignment_return</span>
              Return for Rework
            </h3>
            <p className="text-xs text-on-surface-variant -mt-2 leading-relaxed">
              Outline specific adjustment criteria. This message will be automatically broadcast to the employee's active goal discussion feed.
            </p>
            <textarea 
              value={reworkFeedback}
              onChange={(e) => setReworkFeedback(e.target.value)}
              className="w-full bg-surface border border-outline rounded-xl p-3 text-sm text-on-surface focus:border-primary outline-none min-h-[100px] resize-none" 
              placeholder="e.g. Please clarify the Webinar metrics for Q4 Lead Gen. Let's adjust total weightage distribution to focus on Cloud Uptime Stability objectives."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleReturnForRework} 
                className="bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-primary hover:border-transparent font-label-md font-bold text-xs py-2.5 px-6 rounded-xl transition-all border border-outline-variant cursor-pointer"
              >
                Send Rework Request
              </button>
            </div>
          </div>
          
          {/* Lock Approve Column */}
          <div className="md:col-span-4 bg-primary-container text-on-primary-container p-6 rounded-2xl flex flex-col justify-between gap-4 border border-primary-fixed-dim shadow-sm">
            <div>
              <h3 className="font-title-lg text-primary font-bold text-base flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                Approve & Lock
              </h3>
              <p className="text-xs leading-relaxed text-on-primary-container opacity-85">
                Locking this sheet will finalize these objectives for the FY24 cycle. The employee will receive an active system notification.
              </p>
            </div>
            <button 
              onClick={handleApproveAll} 
              className="bg-primary text-on-primary font-label-md text-xs font-bold py-3.5 px-6 rounded-xl hover:opacity-90 transition-opacity shadow-sm w-full cursor-pointer"
            >
              Approve Sheet Objectives
            </button>
          </div>
        </div>

        {/* Goals Listing Section Header */}
        <div className="mt-6 border-b border-outline-variant pb-2.5 flex justify-between items-end">
          <h2 className="font-headline-md text-primary font-bold text-lg">Goal Details List</h2>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            {employeeGoals.length} Objectives
          </span>
        </div>

        {/* List of Goals */}
        <div className="flex flex-col gap-6">
          {employeeGoals.map((g) => (
             <div key={g.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
              <div className="flex-1 p-6 md:border-r border-outline-variant flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="bg-surface-container-high text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {g.thrustArea}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    g.status === 'Locked' ? 'bg-[#e8f5e9] text-[#2e7d32]' : 
                    g.status === 'Pending Review' ? 'bg-[#fff3e0] text-[#e65100]' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {g.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-primary text-base leading-snug">{g.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1.5">{g.description}</p>
                </div>
                
                {/* Quarterly Planned Target vs. Actual Achievement Tracker */}
                <div className="mt-4 p-4 bg-surface rounded-xl border border-outline-variant/40">
                  <h4 className="text-[10px] font-black text-outline uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">query_stats</span>
                    Quarterly Planned Target vs. Actual Achievement Ledger
                  </h4>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
                      const score = calculateGoalProgress(g, q);
                      const achieved = g.achievements ? g.achievements[q] : 0;
                      return (
                        <div key={q} className="flex flex-col p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/30 relative overflow-hidden">
                          <span className="text-[9px] font-bold text-primary-fixed-dim uppercase tracking-wider mb-1">{q}</span>
                          <span className="text-xs font-black text-primary">{achieved}%</span>
                          <span className={`text-[9px] font-bold mt-1 ${score >= 100 ? 'text-[#2e7d32]' : score >= 50 ? 'text-primary' : 'text-[#ff9800]'}`}>
                            ({score}% score)
                          </span>
                          {/* Progress Meter bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container-high">
                            <div 
                              className={`h-full ${score >= 100 ? 'bg-[#4caf50]' : score >= 50 ? 'bg-primary' : 'bg-[#ff9800]'}`} 
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Live Comments Discussion */}
                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex-grow flex flex-col justify-end">
                  {g.comments.length > 0 && (
                    <div className="bg-surface p-3.5 rounded-xl border border-outline-variant flex flex-col gap-2.5 mb-3 max-h-48 overflow-y-auto">
                      {g.comments.map(c => {
                         const commentAuthor = allUsers.find(u => u.id === c.userId) || mockUsers.find(u => u.id === c.userId);
                         const isMe = c.userId === user.id;
                         return (
                           <div key={c.id} className="flex gap-2 text-xs items-start border-b border-outline-variant/10 pb-2 last:border-0 last:pb-0">
                             <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5">
                               <img src={commentAuthor?.avatar} alt={commentAuthor?.name} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-baseline mb-0.5">
                                 <span className={`font-bold ${isMe ? 'text-primary' : 'text-secondary'}`}>
                                   {isMe ? 'You' : commentAuthor?.name}
                                 </span>
                                 <span className="text-[9px] text-outline">{c.createdAt}</span>
                               </div>
                               <p className="text-on-surface-variant leading-normal">{c.text}</p>
                             </div>
                           </div>
                         )
                      })}
                    </div>
                  )}
                  
                  {/* Post Comment Input */}
                  <div className="relative mt-2">
                    <input 
                      value={commentsMap[g.id] || ''} 
                      onChange={e => setCommentsMap({...commentsMap, [g.id]: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && postComment(g.id)}
                      className="w-full bg-surface border border-outline-variant rounded-xl py-2.5 pl-4 pr-12 text-xs text-on-surface focus:border-primary outline-none" 
                      placeholder="Type a team feedback message..." 
                      type="text" 
                    />
                    <button 
                      onClick={() => postComment(g.id)} 
                      disabled={!(commentsMap[g.id] || '').trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 disabled:opacity-40 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] p-1">send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Config Card */}
              <div className="w-full md:w-72 bg-surface-container-low/30 p-6 flex flex-col gap-5 justify-between shrink-0">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Weightage (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={g.weightage}
                        onChange={e => updateGoalWeightage(g.id, Number(e.target.value))}
                        className="w-full bg-surface border border-outline rounded-lg p-2.5 text-sm font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right pr-9" 
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-outline pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Target Objective Metric</label>
                    <input 
                      type="text"
                      value={g.target}
                      onChange={e => updateGoalTarget(g.id, e.target.value)}
                      className="w-full bg-surface border border-outline rounded-lg p-2.5 text-xs font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-outline-variant/35">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Review Due Date</label>
                  <div className="flex items-center gap-2 p-2.5 border border-outline-variant bg-surface rounded-lg cursor-not-allowed opacity-65 text-xs font-medium">
                    <span className="material-symbols-outlined text-outline text-[16px]">calendar_today</span>
                    <span>Dec 31, 2024</span>
                  </div>
                </div>
              </div>
             </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ManagerApprovals() {
  return (
    <Suspense fallback={
      <div className="flex-1 pt-32 text-center text-sm font-semibold text-outline">
        Syncing goal sheets...
      </div>
    }>
      <ApprovalsContent />
    </Suspense>
  )
}
