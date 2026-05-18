'use client';

import { useState, useEffect } from 'react';
import { useAuth, mockUsers } from '../../../context/AuthContext';
import { useGoals } from '../../../context/GoalContext';
import { 
  getActiveCycle, 
  toggleCycleWindow as toggleCycleWindowQuery, 
  createCycle as createCycleQuery, 
  Cycle 
} from '../../../../lib/queries/cycles';
import { fetchAuditLogs, writeAuditLog, AuditLog } from '../../../../lib/queries/auditLogs';

export default function AdminDashboard() {
  const { user, allUsers, isLoading: authLoading } = useAuth();
  const { goals, updateGoalStatus, isLoading: goalsLoading } = useGoals();
  
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [cycleLoading, setCycleLoading] = useState(true);
  
  // Modals state
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  
  // New Cycle form state
  const [newCycleTitle, setNewCycleTitle] = useState('');
  const [newCycleDesc, setNewCycleDesc] = useState('');

  async function loadAdminData() {
    setCycleLoading(true);
    try {
      const cycle = await getActiveCycle();
      setActiveCycle(cycle);
      
      const fetchedLogs = await fetchAuditLogs();
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setCycleLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  if (authLoading || goalsLoading || cycleLoading) {
    return (
      <div className="md:pl-64 pt-24 min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-primary tracking-wide">Syncing administrative override panels...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const employees = allUsers.filter(u => u.role !== 'Admin');

  const getCompletionRates = (empId: string) => {
    const empGoals = goals.filter(g => g.employeeId === empId);
    if (!empGoals.length) return 0;
    const completedGoals = empGoals.filter(g => g.status === 'Completed' || g.status === 'Locked');
    return Math.round((completedGoals.length / empGoals.length) * 100);
  };

  const handleUnlockGoals = async (empId: string) => {
    const empGoals = goals.filter(g => g.employeeId === empId);
    let unlockedCount = 0;
    
    // Unlock locked goals in parallel
    const promises = empGoals.map(async g => {
      if (g.status === 'Locked') {
        await updateGoalStatus(g.id, 'Returned');
        unlockedCount++;
      }
    });
    await Promise.all(promises);

    if (unlockedCount > 0) {
      const targetEmp = allUsers.find(u => u.id === empId) || mockUsers.find(u => u.id === empId);
      await writeAuditLog(
        user?.name || 'System',
        `Unlocked goals sheet for ${targetEmp?.name || empId} (${unlockedCount} objectives returned to draft).`,
        'warning'
      );
      await loadAdminData();
    }
  };

  const handleToggleCycleWindow = async () => {
    if (!activeCycle) return;
    const nextState = !activeCycle.isOpen;
    const success = await toggleCycleWindowQuery(activeCycle.id, nextState);
    if (success) {
      await writeAuditLog(
        user?.name || 'System',
        `Performance review cycle window manually ${nextState ? 'Opened' : 'Closed'}.`,
        nextState ? 'success' : 'warning'
      );
      await loadAdminData();
    }
  };

  const handleCreateCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleTitle.trim()) return;

    const newCycle = await createCycleQuery(newCycleTitle.trim(), true);
    if (newCycle) {
      await writeAuditLog(
        user?.name || 'System',
        `Created and deployed new goal cycle: "${newCycleTitle}".`,
        'success'
      );
      
      // Reset and close
      setNewCycleTitle('');
      setNewCycleDesc('');
      setIsCycleModalOpen(false);
      await loadAdminData();
    }
  };


  return (
    <main className="md:pl-64 pt-24 pb-8 px-4 md:px-8 min-h-screen flex-grow">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="font-headline-lg text-primary text-3xl font-bold">Admin Operations Panel</h1>
            <p className="text-on-surface-variant font-body-md mt-1">
              Administer system cycles, override locked objective states, and audit organization progress logs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cycle Management Status */}
          <div className="lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-center shadow-sm">
             <div className="flex flex-col gap-1.5 text-center md:text-left">
                  <h2 className="font-title-lg font-bold text-primary">Current Cycle: {activeCycle?.name || 'None Active'}</h2>
                  <p className="text-sm font-body-md text-on-surface-variant">
                    System objective submission window status: {' '}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      activeCycle?.isOpen ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'
                    }`}>
                      {activeCycle?.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </p>
             </div>
             <div className="flex flex-wrap gap-3 justify-center">
                  {activeCycle && (
                    <button 
                      onClick={handleToggleCycleWindow}
                      className={`font-label-md py-2 px-5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                        activeCycle.isOpen 
                          ? 'bg-error-container text-on-error-container hover:opacity-90 shadow-sm' 
                          : 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                      }`}
                    >
                      {activeCycle.isOpen ? 'Close Cycle Window' : 'Open Cycle Window'}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsCycleModalOpen(true)}

                    className="bg-surface-container-high hover:bg-surface-variant text-primary border border-outline-variant font-label-md py-2 px-5 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Create New Cycle
                  </button>
             </div>
          </div>

          {/* Org Goals Completion List */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm mt-2">
            <div className="p-5 border-b border-surface-container-high flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-title-lg text-primary font-bold text-base">Direct Reports Cycle Completion</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low/40">
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold">Employee Name</th>
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold">Job Title</th>
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold">Goal Completion</th>
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold text-right">Emergency Override</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-background text-sm">
                  {employees.map(emp => {
                     const rate = getCompletionRates(emp.id);
                     const isLocked = goals.some(g => g.employeeId === emp.id && g.status === 'Locked');
                     return (
                       <tr key={emp.id} className="border-b border-surface-container-high hover:bg-surface-container-low/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full border border-outline-variant object-cover" />
                              <span className="font-semibold text-primary">{emp.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant">{emp.title}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2.5 bg-surface-container-high rounded-full overflow-hidden shrink-0">
                                <div 
                                  className="h-full bg-primary transition-all duration-500 rounded-full" 
                                  style={{ width: `${rate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-on-surface-variant">{rate}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                             {isLocked ? (
                               <button 
                                 onClick={() => handleUnlockGoals(emp.id)} 
                                 className="bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-primary hover:border-transparent border border-outline-variant font-label-md text-[11px] py-1.5 px-4 rounded-full transition-colors flex items-center justify-end gap-1.5 ml-auto cursor-pointer"
                               >
                                 <span className="material-symbols-outlined text-[13px]">lock_open</span>
                                 Unlock Sheet
                               </button>
                             ) : (
                               <span className="text-outline text-xs font-medium px-4 py-1.5 opacity-60">No locks active</span>
                             )}
                          </td>
                       </tr>
                     )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* HR Completion Heatgrid */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mt-2">
            <h3 className="font-title-lg text-primary font-bold text-base border-b border-surface-container-high pb-4 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">grid_on</span>
              HR Performance Check-in Heatgrid (Q1 - Q4)
            </h3>
            <p className="text-xs text-on-surface-variant -mt-2 mb-4 leading-relaxed">
              Real-time monitoring of average quarterly check-in values across active objectives.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {employees.map(emp => {
                return (
                  <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 gap-4">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full border border-outline-variant object-cover" />
                      <div>
                        <span className="font-semibold text-primary text-sm block leading-none">{emp.name}</span>
                        <span className="text-[10px] text-on-surface-variant mt-1 block">{emp.title}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5">
                      {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => {
                        const empGoals = goals.filter(g => g.employeeId === emp.id);
                        let avg = 0;
                        if (empGoals.length > 0) {
                          const sum = empGoals.reduce((acc, g) => acc + (g.achievements ? g.achievements[q] : 0), 0);
                          avg = Math.round(sum / empGoals.length);
                        }
                        
                        let bgColor = 'bg-surface-container-high text-on-surface-variant';
                        let label = 'No Log';
                        if (empGoals.length > 0) {
                          if (avg >= 90) {
                            bgColor = 'bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7]';
                            label = `${avg}% High`;
                          } else if (avg >= 50) {
                            bgColor = 'bg-[#e8f0fe] text-primary border border-[#aecbfa]';
                            label = `${avg}% Mid`;
                          } else if (avg > 0) {
                            bgColor = 'bg-[#fff3e0] text-[#e65100] border border-[#ffe0b2]';
                            label = `${avg}% Low`;
                          } else {
                            bgColor = 'bg-red-50 text-red-600 border border-red-200';
                            label = 'Pending';
                          }
                        }
                        
                        return (
                          <div key={q} className={`flex flex-col items-center justify-center w-20 py-1.5 rounded-lg text-center ${bgColor}`}>
                            <span className="text-[8px] font-bold uppercase tracking-wide">{q}</span>
                            <span className="text-[10px] font-black mt-0.5">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Audit Logs Trail */}
          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-container-high">
              <h3 className="font-title-lg text-primary font-bold text-base">Operations Log</h3>
              <span className="material-symbols-outlined text-on-surface-variant">history</span>
            </div>
            
            <div className="flex flex-col gap-4 flex-grow">
              {logs.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.type === 'success' ? 'bg-[#2e7d32]' : item.type === 'warning' ? 'bg-error' : 'bg-primary'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-on-background leading-normal break-words">
                      <span className="font-bold text-primary">{item.actor}:</span> {item.action}
                    </p>
                    <p className="text-[10px] text-outline font-semibold mt-1">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setIsLogsModalOpen(true)}
              className="mt-6 w-full border border-outline-variant py-2.5 rounded-xl font-label-md font-bold text-xs hover:bg-surface-container-high text-primary transition-colors cursor-pointer"
            >
              View Full Audit Ledger
            </button>
          </div>

          {/* Rule-Based Escalation Panel */}
          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col mt-2">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-surface-container-high">
              <h3 className="font-title-lg text-primary font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[20px]">notification_important</span>
                Rule-Based Escalations
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant -mt-2 mb-4 leading-relaxed">
              Automated triggers monitoring cycle submissions, weightage defaults, and tracking compliance deviations.
            </p>
            
            <div className="space-y-4 flex-grow">
              {(() => {
                const escalations: Array<{ id: string; employee: any; type: string; message: string; rule: string }> = [];
                
                employees.forEach(emp => {
                  const empGoals = goals.filter(g => g.employeeId === emp.id);
                  if (!empGoals.length) {
                    escalations.push({
                      id: `no-goals-${emp.id}`,
                      employee: emp,
                      type: 'error',
                      rule: 'Submission Compliance Rule',
                      message: 'Goal sheet draft has not been configured or submitted for this cycle.'
                    });
                  } else {
                    const totalWeight = empGoals.reduce((sum, g) => sum + g.weightage, 0);
                    if (totalWeight !== 100) {
                      escalations.push({
                        id: `weight-${emp.id}`,
                        employee: emp,
                        type: 'warning',
                        rule: 'Weightage Balancing Rule',
                        message: `Goal sheet weightage sum equals ${totalWeight}% instead of strictly 100%.`
                      });
                    }
                    
                    const q3Sum = empGoals.reduce((sum, g) => sum + (g.achievements ? g.achievements.Q3 : 0), 0);
                    const q3Avg = Math.round(q3Sum / empGoals.length);
                    if (q3Avg < 60) {
                      escalations.push({
                        id: `slow-${emp.id}`,
                        employee: emp,
                        type: 'slow',
                        rule: 'Progress Deviation Rule',
                        message: `Active Q3 cumulative progress is at ${q3Avg}%, lagging behind standard performance bounds.`
                      });
                    }
                  }
                });

                if (!escalations.length) {
                  return (
                    <div className="p-4 bg-[#e8f5e9]/50 border border-[#a5d6a7]/30 text-[#2e7d32] text-xs font-bold text-center rounded-xl">
                      All cycles and compliance targets are 100% compliant. No escalations active.
                    </div>
                  );
                }

                return escalations.map(esc => {
                  const handleTriggerReminder = async () => {
                    await writeAuditLog(
                      user?.name || 'HR Admin',
                      `Triggered official escalation alert reminder to ${esc.employee.name} regarding: "${esc.rule}".`,
                      'warning'
                    );
                    alert(`Remediation notification alert issued to ${esc.employee.name} for rule breach: "${esc.rule}".`);
                    await loadAdminData();
                  };

                  return (
                    <div key={esc.id} className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/35 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                          esc.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                          esc.type === 'warning' ? 'bg-[#fff3e0] text-[#e65100] border border-[#ffe0b2]' : 'bg-primary-container text-on-primary-container border border-primary-fixed-dim'
                        }`}>
                          {esc.rule}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <img src={esc.employee.avatar} alt={esc.employee.name} className="w-6.5 h-6.5 rounded-full object-cover shrink-0 mt-0.5 border border-outline-variant" />
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-bold text-primary">{esc.employee.name}</p>
                          <p className="text-[10px] text-on-surface-variant leading-relaxed mt-1 break-words">{esc.message}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleTriggerReminder}
                        className="w-full text-center py-1.5 bg-primary text-on-primary hover:opacity-90 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-opacity cursor-pointer shadow-sm animate-pulse"
                      >
                        <span className="material-symbols-outlined text-[13px]">notifications_active</span>
                        Issue Compliance Alert
                      </button>
                    </div>
                  )
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Cycle */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-primary font-bold text-lg">Deploy New Goal Cycle</h3>
              <button 
                onClick={() => setIsCycleModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateCycleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Cycle Title</label>
                <input 
                  type="text" 
                  value={newCycleTitle}
                  onChange={(e) => setNewCycleTitle(e.target.value)}
                  placeholder="e.g. FY25 Objectives Alignment"
                  required
                  className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Description / Target</label>
                <textarea 
                  value={newCycleDesc}
                  onChange={(e) => setNewCycleDesc(e.target.value)}
                  placeholder="Describe focus targets, timeline bounds, and core parameters..."
                  rows={3}
                  className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsCycleModalOpen(false)}
                  className="px-4 py-2 border border-outline rounded-lg text-xs font-bold hover:bg-surface-container-low text-on-surface"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90"
                >
                  Activate Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Audit Ledger */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-lg rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-primary font-bold text-lg">Organization Audit Ledger</h3>
              <button 
                onClick={() => setIsLogsModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1">
              {logs.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm pb-3 border-b border-outline-variant/30 last:border-b-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    item.type === 'success' ? 'bg-[#2e7d32]' : item.type === 'warning' ? 'bg-error' : 'bg-primary'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{item.actor}</p>
                    <p className="text-on-surface-variant leading-relaxed text-xs mt-0.5">{item.action}</p>
                    <p className="text-[10px] text-outline mt-1 font-bold">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4 mt-2 border-t border-outline-variant">
              <button 
                onClick={() => setIsLogsModalOpen(false)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
