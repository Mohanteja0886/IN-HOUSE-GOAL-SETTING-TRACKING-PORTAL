'use client';

import { useState } from 'react';
import { useAuth, mockUsers } from '../../../context/AuthContext';
import { useGoals } from '../../../context/GoalContext';
import Link from 'next/link';
import { createGoal } from '../../../../lib/queries/goals';

export default function ManagerDashboard() {
  const { user, allUsers, isLoading: authLoading } = useAuth();
  const { goals, addGoal, isLoading: goalsLoading } = useGoals();
  
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Push Shared Goal states
  const [pushThrust, setPushThrust] = useState('strategic');
  const [pushTitle, setPushTitle] = useState('');
  const [pushDesc, setPushDesc] = useState('');
  const [pushUom, setPushUom] = useState('numeric');
  const [pushTarget, setPushTarget] = useState('');
  const [pushWeight, setPushWeight] = useState(15);
  const [selectedReportees, setSelectedReportees] = useState<string[]>([]);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  if (authLoading || goalsLoading) {
    return (
      <div className="md:pl-64 pt-24 min-h-screen max-w-full overflow-x-hidden flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-primary tracking-wide">Syncing team objectives...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Resolve manager UUID or fallback ID
  const myReports = allUsers.filter(u => u.managerId === user.id).length > 0
    ? allUsers.filter(u => u.managerId === user.id)
    : mockUsers.filter(u => u.managerId === 'mgr1'); // robust fallback for initial mounts

  const reporteeIds = myReports.map(u => u.id);
  const teamGoals = goals.filter(g => reporteeIds.includes(g.employeeId));

  const submittedGoals = teamGoals.filter(g => g.status === 'Submitted' || g.status === 'On Track' || g.status === 'Behind' || g.status === 'Completed' || g.status === 'Locked');
  const pendingGoals = teamGoals.filter(g => g.status === 'Pending Review');
  const returnedGoals = teamGoals.filter(g => g.status === 'Returned');

  // Map employee objective metrics for review
  const reportStats = myReports.map(report => {
    const empGoals = teamGoals.filter(g => g.employeeId === report.id);
    let generalStatus = 'Not Started';
    let dotColor = 'bg-outline';

    if (empGoals.some(g => g.status === 'Pending Review')) {
       generalStatus = 'Pending Review';
       dotColor = 'bg-[#e65100]';
    } else if (empGoals.some(g => g.status === 'Returned')) {
       generalStatus = 'Returned';
       dotColor = 'bg-outline';
    } else if (empGoals.length > 0) {
       const allLocked = empGoals.every(g => g.status === 'Locked' || g.status === 'Completed');
       generalStatus = allLocked ? 'Approved & Locked' : 'Submitted';
       dotColor = allLocked ? 'bg-[#1b5e20]' : 'bg-[#1e8e3e]';
    }

    return {
       ...report,
       generalStatus,
       dotColor,
       lastUpdated: empGoals[0]?.lastUpdated || 'No recent activity'
    };
  });


  const handleExportReport = () => {
    if (!teamGoals.length) {
      alert("No team goals registered in system to export.");
      return;
    }

    const csvRows = [
      ["Employee Name", "Job Title", "Strategic Focus", "Goal Title", "Unit of Measure", "Planned Target", "Q1 Achievement", "Q2 Achievement", "Q3 Achievement", "Q4 Achievement", "Overall Status"].join(",")
    ];

    myReports.forEach(report => {
      const empGoals = teamGoals.filter(g => g.employeeId === report.id);
      empGoals.forEach(g => {
        const row = [
          `"${report.name}"`,
          `"${report.title}"`,
          `"${g.thrustArea.toUpperCase()}"`,
          `"${g.title.replace(/"/g, '""')}"`,
          `"${g.uom}"`,
          `"${g.target.replace(/"/g, '""')}"`,
          g.achievements?.Q1 || 0,
          g.achievements?.Q2 || 0,
          g.achievements?.Q3 || 0,
          g.achievements?.Q4 || 0,
          `"${g.status}"`
        ];
        csvRows.push(row.join(","));
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Team_Objectives_Achievement_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePushGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !selectedReportees.length) {
      alert("Please complete the title and select at least one employee.");
      return;
    }

    const underweight = Number(pushWeight) < 10;
    if (underweight) {
      alert("Validation Error: Pushed goal weightage must be at least 10%.");
      return;
    }

    // 1. Create primary owner master goal record owned by the manager
    const masterGoal = await createGoal({
      employeeId: user.id,
      title: pushTitle.trim(),
      thrustArea: pushThrust,
      description: pushDesc.trim() || 'Departmental alignment KPI.',
      uom: pushUom as any,
      target: pushTarget.trim() || '100',
      weightage: Number(pushWeight),
    });

    if (masterGoal) {
      // 2. Clone to all selected direct report sheets as a locked, shared goal
      const promises = selectedReportees.map(async (empId) => {
        await addGoal({
          employeeId: empId,
          title: pushTitle.trim(),
          thrustArea: pushThrust,
          description: pushDesc.trim() || 'Departmental alignment KPI.',
          uom: pushUom as any,
          target: pushTarget.trim() || '100',
          weightage: Number(pushWeight),
          isShared: true,
          sharedFrom: masterGoal.id
        });
      });
      await Promise.all(promises);

      alert(`Departmental KPI successfully pushed as a Shared Goal to ${selectedReportees.length} employees!`);
      
      // Reset form
      setPushTitle('');
      setPushDesc('');
      setPushTarget('');
      setPushWeight(15);
      setSelectedReportees([]);
      setIsPushModalOpen(false);
    } else {
      alert("Failed to deploy departmental KPI master template.");
    }
  };

  const filteredReports = reportStats.filter(item => {
    if (statusFilter === 'All Statuses') return true;
    if (statusFilter === 'Pending') return item.generalStatus === 'Pending Review';
    if (statusFilter === 'Submitted') return item.generalStatus === 'Submitted' || item.generalStatus === 'Approved & Locked';
    return true;
  });

  return (
    <main className="md:pl-64 pt-24 pb-8 px-4 md:px-8 min-h-screen max-w-full overflow-x-hidden flex-grow">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="font-headline-lg text-primary text-3xl font-bold">Team Objectives Hub</h1>
            <p className="text-on-surface-variant font-body-md mt-1">
              Analyze employee submissions, track quarter progress curves, and lock objective parameters.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsPushModalOpen(true)}
              className="bg-primary text-on-primary font-label-md py-2.5 px-4 rounded-xl hover:opacity-90 transition-colors flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              Push Departmental KPI
            </button>
            <button 
              onClick={handleExportReport}
              className="bg-surface-container-lowest border border-outline-variant text-primary font-label-md py-2.5 px-4 rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export Team Ledger
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Metrics Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                </div>
                <span className="bg-[#e8f5e9] text-[#2e7d32] text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Submitted
                </span>
              </div>
              <div>
                <p className="font-headline-lg text-primary text-3xl font-black">{submittedGoals.length}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                  Active Objectives
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="absolute right-0 top-0 w-2.5 h-full bg-tertiary-fixed"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                </div>
                <span className="bg-[#fff3e0] text-[#e65100] text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Review Pending
                </span>
              </div>
              <div>
                <p className="font-headline-lg text-primary text-3xl font-black">{pendingGoals.length}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                  Pending Audit
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">undo</span>
                </div>
                <span className="bg-surface-container-low text-on-surface-variant text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Revisions
                </span>
              </div>
              <div>
                <p className="font-headline-lg text-primary text-3xl font-black">{returnedGoals.length}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                  Returned for Rework
                </p>
              </div>
            </div>
          </div>

          {/* Performance Trends Chart */}
          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-container-high">
              <h3 className="font-title-lg text-primary font-bold text-base">Cycle Achievement Trends</h3>
            </div>
            <div className="flex-grow flex items-end gap-3.5 justify-between h-32 mt-2 px-1">
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-secondary-fixed-dim rounded-t h-[40%] hover:bg-secondary-fixed transition-colors cursor-pointer relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow">
                    Q1: 40%
                  </div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-semibold">Q1</span>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-secondary-fixed-dim rounded-t h-[65%] hover:bg-secondary-fixed transition-colors cursor-pointer relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow">
                    Q2: 65%
                  </div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-semibold">Q2</span>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-primary-fixed rounded-t h-[85%] hover:bg-primary-fixed-dim transition-colors cursor-pointer relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow">
                    Q3: 85%
                  </div>
                </div>
                <span className="text-[10px] text-primary font-bold">Q3</span>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-surface-container-high rounded-t h-[15%] border border-dashed border-outline-variant hover:bg-surface-container-highest transition-colors cursor-pointer relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow">
                    Q4: In Progress
                  </div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-semibold">Q4</span>
              </div>
            </div>
          </div>

          {/* Direct Reports Table */}
          <div className="lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm mt-2">
            <div className="p-5 border-b border-surface-container-high flex justify-between items-center bg-surface-bright">
              <h3 className="font-title-lg text-primary font-bold text-base">Direct Reports Roster</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[16px]">filter_list</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-9 pr-9 py-2 bg-surface border border-outline-variant rounded-lg text-xs font-bold text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Pending">Pending Audit</option>
                    <option value="Submitted">Approved / Submitted</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-[16px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low/40">
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold">Employee Name</th>
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold">Job Title</th>
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold">Goal Status</th>
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold">Last Checked</th>
                    <th className="py-4 px-6 text-xs font-label-md text-on-surface-variant font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-background text-sm">
                  {filteredReports.map(report => (
                     <tr key={report.id} className="border-b border-surface-container-high hover:bg-surface-container-low/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img src={report.avatar} alt={report.name} className="w-8 h-8 rounded-full border border-outline-variant object-cover animate-fade-in" />
                            <span className="font-semibold text-primary">{report.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-on-surface-variant">{report.title}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${report.dotColor} animate-pulse`}></span>
                            <span className="font-semibold text-on-surface">{report.generalStatus}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-on-surface-variant">{report.lastUpdated}</td>
                        <td className="py-4 px-6 text-right">
                          {report.generalStatus === 'Pending Review' ? (
                             <Link 
                               href={`/manager/approvals?employeeId=${report.id}`} 
                               className="bg-primary text-on-primary font-label-md text-[11px] py-1.5 px-4 rounded-full hover:opacity-90 transition-opacity font-bold shadow-sm"
                             >
                               Review Sheet
                             </Link>
                          ) : (
                             <Link 
                               href={`/manager/approvals?employeeId=${report.id}`} 
                               className="border border-outline-variant hover:bg-surface-container-high text-primary font-label-md text-[11px] py-1.5 px-4 rounded-full transition-colors font-bold"
                             >
                               View Details
                             </Link>
                          )}
                        </td>
                     </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs font-semibold text-outline italic">
                        No team reports match the selected status filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Push Departmental KPI Goal */}
      {isPushModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-lg rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-primary font-bold text-lg">Push Departmental KPI Goal</h3>
              <button 
                onClick={() => setIsPushModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handlePushGoal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Strategic Thrust Area</label>
                  <select 
                    value={pushThrust} 
                    onChange={e => setPushThrust(e.target.value)} 
                    className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="growth">Growth & Revenue</option>
                    <option value="stability">Operational Stability</option>
                    <option value="culture">Team & Culture</option>
                    <option value="strategic">Strategic Focus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Unit of Measure (UoM)</label>
                  <select 
                    value={pushUom} 
                    onChange={e => setPushUom(e.target.value)} 
                    className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="numeric">Numeric Metric</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="timeline">Target Date</option>
                    <option value="binary">Binary (Yes/No)</option>
                    <option value="zero-based">Zero-based (Zero = Success)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Goal Title</label>
                <input 
                  type="text" 
                  value={pushTitle}
                  onChange={e => setPushTitle(e.target.value)}
                  placeholder="e.g. Maintain 100% corporate compliance on data privacy audits"
                  required
                  className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Description & Milestones</label>
                <textarea 
                  value={pushDesc}
                  onChange={e => setPushDesc(e.target.value)}
                  placeholder="Details, milestones, or quality standards expected..."
                  rows={2}
                  className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Target Metric</label>
                  <input 
                    type="text" 
                    value={pushTarget}
                    onChange={e => setPushTarget(e.target.value)}
                    placeholder="e.g. 100% or 0 (Zero)"
                    required
                    className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Default Weightage (%)</label>
                  <input 
                    type="number" 
                    min="10" 
                    max="100"
                    value={pushWeight}
                    onChange={e => setPushWeight(Number(e.target.value))}
                    required
                    className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-right font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">Select Target Direct Reports</label>
                <div className="space-y-2 bg-surface p-3 rounded-lg border border-outline-variant max-h-32 overflow-y-auto">
                  {myReports.map(emp => {
                    const isChecked = selectedReportees.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center gap-3 cursor-pointer text-xs font-semibold p-1 hover:bg-surface-container-low rounded transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            setSelectedReportees(prev => 
                              isChecked ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                            );
                          }}
                          className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-primary focus:ring-1 cursor-pointer"
                        />
                        <img src={emp.avatar} alt={emp.name} className="w-5.5 h-5.5 rounded-full object-cover border border-outline-variant" />
                        <span className="text-primary">{emp.name} ({emp.title})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsPushModalOpen(false)}
                  className="px-4 py-2 border border-outline rounded-lg text-xs font-bold hover:bg-surface-container-low text-on-surface"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!pushTitle.trim() || selectedReportees.length === 0}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  Deploy & Push KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
