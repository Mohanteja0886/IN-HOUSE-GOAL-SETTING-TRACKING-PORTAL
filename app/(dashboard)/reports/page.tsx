'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchGoals } from '../../../lib/queries/goals';
import { getAllUsers } from '../../../lib/queries/users';
import { fetchAuditLogs, AuditLog } from '../../../lib/queries/auditLogs';
import { Goal, User } from '../../types';
import Link from 'next/link';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'matrix' | 'compliance' | 'audit'>('matrix');
  
  // Data States
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Compliance Filter State
  const [deptFilter, setDeptFilter] = useState('All');

  // Load consolidated data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fetchedGoals, fetchedUsers, fetchedLogs] = await Promise.all([
          fetchGoals(),
          getAllUsers(),
          fetchAuditLogs()
        ]);
        setGoals(fetchedGoals);
        setUsers(fetchedUsers);
        setAuditLogs(fetchedLogs);
      } catch (err) {
        console.error('Error compiling reports database:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  if (!user) return null;

  // Compile unified reports mapping each goal to its employee profile
  const compiledReports = goals.map(goal => {
    const owner = users.find(u => u.id === goal.employeeId);
    
    // Calculate achievement progress score based on BRD formula
    let calculatedProgress = 0;
    const qValues = goal.achievements ? [goal.achievements.Q1, goal.achievements.Q2, goal.achievements.Q3, goal.achievements.Q4] : [0,0,0,0];
    const latestActual = qValues.find((v, idx) => v > 0 || (idx === qValues.length - 1 && v === 0)) || 0;
    const numericTarget = parseFloat(goal.target) || 0;

    if (goal.uom === 'numeric' || goal.uom === 'percentage') {
      // Min (higher is better): Achievement / Target
      if (numericTarget > 0) {
        calculatedProgress = Math.min(Math.round((latestActual / numericTarget) * 100), 100);
      }
    } else if (goal.uom === 'zero-based') {
      // Zero = Success: If 0 -> 100%, else 0%
      calculatedProgress = latestActual === 0 ? 100 : 0;
    } else if (goal.uom === 'binary') {
      calculatedProgress = latestActual > 0 ? 100 : 0;
    } else {
      // Timeline or zero target fallbacks
      calculatedProgress = latestActual > 0 ? 100 : 0;
    }

    return {
      ...goal,
      employeeName: owner ? owner.name : 'Unknown Employee',
      employeeTitle: owner ? owner.title : 'Staff Member',
      employeeRole: owner ? owner.role : 'Employee',
      progressScore: calculatedProgress,
      latestActual
    };
  });

  // Filtered reports for search query
  const filteredReports = compiledReports.filter(r => 
    r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.thrustArea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compile compliance metrics per user
  const employeeCompliance = users.filter(u => u.role === 'Employee').map(emp => {
    const empGoals = goals.filter(g => g.employeeId === emp.id);
    const totalWeight = empGoals.reduce((sum, g) => sum + g.weightage, 0);
    const lockedCount = empGoals.filter(g => g.status === 'Locked' || g.status === 'Completed' || g.status === 'On Track').length;
    
    let status: 'Drafting' | 'Awaiting Review' | 'Aligned & Locked' = 'Drafting';
    if (lockedCount > 0 && lockedCount === empGoals.length) {
      status = 'Aligned & Locked';
    } else if (empGoals.some(g => g.status === 'Submitted' || g.status === 'Pending Review')) {
      status = 'Awaiting Review';
    }

    return {
      ...emp,
      goalCount: empGoals.length,
      totalWeight,
      status
    };
  });

  // Calculate high level stats
  const totalGoals = goals.length;
  const lockedGoals = goals.filter(g => g.status === 'Locked' || g.status === 'On Track' || g.status === 'Completed').length;
  const complianceRate = totalGoals > 0 ? Math.round((lockedGoals / totalGoals) * 100) : 0;
  
  // CSV Export Trigger
  const handleExportCSV = () => {
    const headers = [
      'Employee Name',
      'Role',
      'Thrust Area',
      'Goal Title',
      'UoM',
      'Planned Target',
      'Q1 Actual',
      'Q2 Actual',
      'Q3 Actual',
      'Q4 Actual',
      'Progress Score (%)',
      'Status'
    ];

    const rows = filteredReports.map(r => [
      r.employeeName,
      r.employeeRole,
      r.thrustArea,
      r.title,
      r.uom,
      r.target,
      r.achievements?.Q1 || 0,
      r.achievements?.Q2 || 0,
      r.achievements?.Q3 || 0,
      r.achievements?.Q4 || 0,
      `${r.progressScore}%`,
      r.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GoalStream_Achievement_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="pl-4 pr-4 md:pl-72 md:pr-8 pt-24 min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-primary tracking-wide">Syncing governance datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="pl-4 pr-4 md:pl-72 md:pr-8 pt-24 pb-8 min-h-screen flex-grow">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        
        {/* Banner Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-container-lowest p-6 border border-outline-variant rounded-2xl shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Governance & Compliance Suite
            </div>
            <h1 className="font-headline-lg text-primary text-3xl font-bold">Reports Center</h1>
            <p className="text-sm text-secondary font-medium max-w-2xl">
              Audit objective cycles, track check-in completion, and download real-time achievement matrix reports.
            </p>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="bg-primary text-on-primary text-xs font-bold py-3 px-5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Achievement Matrix (CSV)
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-outline-variant gap-2 mt-4">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            Achievement Matrix
          </button>
          
          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'compliance'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">rule_folder</span>
            Completion Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history_edu</span>
            Audit Trail Logs
          </button>
        </div>

        {/* Dynamic Content Views */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            
            {/* Search Filter bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface p-4 border border-outline-variant rounded-xl shadow-sm">
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search name, goal, thrust area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface text-xs focus:outline-none focus:border-primary text-on-surface font-medium"
                />
              </div>
              <div className="text-[11px] text-secondary font-semibold">
                Showing {filteredReports.length} goal nodes across the system
              </div>
            </div>

            {/* Achievement Table Grid */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/60 text-outline uppercase font-semibold text-[10px] tracking-wider">
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Thrust Area</th>
                      <th className="py-4 px-6">Goal Alignment</th>
                      <th className="py-4 px-6 text-center">UoM</th>
                      <th className="py-4 px-6 text-right">Target</th>
                      <th className="py-4 px-6 text-right">Latest Actual</th>
                      <th className="py-4 px-6 text-center">Progress</th>
                      <th className="py-4 px-6 text-center">Cycle Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {filteredReports.length > 0 ? (
                      filteredReports.map(report => (
                        <tr key={report.id} className="hover:bg-surface-container-high/20 transition-colors text-xs text-on-surface">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {report.employeeName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-primary">{report.employeeName}</h3>
                                <p className="text-[9px] text-secondary font-medium">{report.employeeTitle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-secondary">{report.thrustArea}</td>
                          <td className="py-4 px-6">
                            <div className="max-w-xs">
                              <h4 className="font-bold text-on-surface line-clamp-1">{report.title}</h4>
                              <p className="text-[10px] text-secondary line-clamp-1">{report.description}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center shrink-0">
                            <span className="px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 font-mono text-[9px] font-bold text-secondary uppercase">
                              {report.uom}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-bold font-mono text-primary">{report.target}</td>
                          <td className="py-4 px-6 text-right font-bold font-mono text-[#008080]">{report.latestActual}</td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col items-center gap-1 min-w-[90px]">
                              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-primary" 
                                  style={{ width: `${report.progressScore}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-[9px] font-bold text-secondary">{report.progressScore}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold inline-block border ${
                              report.status === 'Locked' || report.status === 'On Track' || report.status === 'Completed'
                                ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]/40'
                                : report.status === 'Submitted' || report.status === 'Pending Review'
                                  ? 'bg-[#e3f2fd] text-[#1565c0] border-[#90caf9]/40'
                                  : 'bg-[#fff3e0] text-[#ef6c00] border-[#ffe0b2]/40'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 px-6 text-center text-outline font-semibold text-xs">
                          No achievement matching your filters was found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="grid grid-cols-12 gap-6">
            
            {/* Quick Stats Column */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              
              {/* Compliance Score */}
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-6 translate-x-6"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    <span className="material-symbols-outlined text-[20px]">donut_large</span>
                  </div>
                  <span className="px-2.5 py-1 bg-surface-container-high rounded-full font-bold text-[9px] text-secondary">
                    Primary Cycle Lock
                  </span>
                </div>
                <div>
                  <h3 className="text-secondary font-bold text-xs uppercase tracking-wider mb-1">Aligned compliance</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary tracking-tight font-mono">{complianceRate}%</span>
                    <span className="text-[10px] text-[#4caf50] font-bold">↑ 4% this month</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-3.5">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${complianceRate}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Cycle Completion Summary */}
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-2">
                  Goal Cycle States
                </h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-secondary">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef6c00]"></span>
                      <span>Drafting Goals</span>
                    </div>
                    <span className="font-bold text-primary font-mono">
                      {employeeCompliance.filter(e => e.status === 'Drafting').length} Employees
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-secondary">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1565c0]"></span>
                      <span>Awaiting L1 Review</span>
                    </div>
                    <span className="font-bold text-primary font-mono">
                      {employeeCompliance.filter(e => e.status === 'Awaiting Review').length} Employees
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-secondary">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2e7d32]"></span>
                      <span>Approved & Locked</span>
                    </div>
                    <span className="font-bold text-primary font-mono">
                      {employeeCompliance.filter(e => e.status === 'Aligned & Locked').length} Employees
                    </span>
                  </div>
                </div>
              </div>

              {/* Departmental Progress Chart */}
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-2">
                  Department Health
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-secondary uppercase mb-1">
                      <span>Engineering</span>
                      <span className="font-mono">82%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-secondary uppercase mb-1">
                      <span>Product Suite</span>
                      <span className="font-mono">75%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-secondary uppercase mb-1">
                      <span>Global Sales</span>
                      <span className="font-mono">60%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Compliance Table Column */}
            <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-outline-variant/60 bg-surface-container-low flex justify-between items-center">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Employee Alignment Compliance
                </h3>
                <span className="px-2.5 py-1 bg-primary-container text-on-primary-container rounded-full text-[9px] font-bold">
                  {employeeCompliance.length} Total Registered
                </span>
              </div>
              <div className="overflow-x-auto flex-grow">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/60 text-outline uppercase font-semibold text-[9px] tracking-wider bg-surface-container-low/40">
                      <th className="py-3 px-5">Employee Roster</th>
                      <th className="py-3 px-5 text-center">Weightage Sync</th>
                      <th className="py-3 px-5 text-center">Cycle State</th>
                      <th className="py-3 px-5 text-center">Compliance Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {employeeCompliance.map(emp => (
                      <tr key={emp.id} className="hover:bg-surface-container-high/20 transition-colors text-xs text-on-surface">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container-high text-secondary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-primary">{emp.name}</h4>
                              <p className="text-[9px] text-secondary font-medium">{emp.title}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-mono text-xs font-black ${
                              emp.totalWeight === 100 ? 'text-[#2e7d32]' : 'text-[#ef6c00]'
                            }`}>
                              {emp.totalWeight}%
                            </span>
                            <span className="text-[8px] font-semibold text-secondary font-mono mt-0.5">
                              ({emp.goalCount} active goals)
                            </span>
                          </div>
                        </td>
                        
                        <td className="py-4 px-5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block border ${
                            emp.status === 'Aligned & Locked'
                              ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]/40'
                              : emp.status === 'Awaiting Review'
                                ? 'bg-[#e3f2fd] text-[#1565c0] border-[#90caf9]/40'
                                : 'bg-[#fff3e0] text-[#ef6c00] border-[#ffe0b2]/40'
                          }`}>
                            {emp.status}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-center font-semibold text-[10px] text-secondary">
                          {emp.totalWeight === 100 && emp.status === 'Aligned & Locked' ? (
                            <span className="text-[#2e7d32] flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Fully Compliant
                            </span>
                          ) : emp.totalWeight < 100 ? (
                            <span className="text-[#ef6c00] flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              Weight {emp.totalWeight}% vs 100%
                            </span>
                          ) : (
                            <span className="text-[#1565c0] flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                              Pending L1 Lock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            
            {/* Audit Log Box */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant/60 bg-surface-container-low flex justify-between items-center">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  Cycle Exception Audit Trail (Post-Lock logs)
                </h3>
                <span className="px-2.5 py-1 bg-surface-container-high rounded-full font-mono text-[9px] font-bold text-secondary">
                  Secured & Read-only
                </span>
              </div>
              
              <div className="divide-y divide-outline-variant/30 max-h-[600px] overflow-y-auto">
                {auditLogs.length > 0 ? (
                  auditLogs.map(log => (
                    <div key={log.id} className="p-4 hover:bg-surface-container-high/10 transition-colors flex items-start gap-4">
                      
                      {/* Log Action Tier Icon */}
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        log.type === 'success'
                          ? 'bg-[#e8f5e9]/70 text-[#2e7d32]'
                          : log.type === 'warning'
                            ? 'bg-[#ffe0b2]/70 text-[#ef6c00]'
                            : 'bg-[#e3f2fd]/70 text-[#1565c0]'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {log.type === 'success' 
                            ? 'check_circle' 
                            : log.type === 'warning' 
                              ? 'error' 
                              : 'info'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-4">
                          <h4 className="font-bold text-primary text-xs truncate">
                            {log.actor}
                          </h4>
                          <span className="font-mono text-[9px] text-secondary font-bold shrink-0">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-secondary font-medium mt-1 leading-relaxed">
                          {log.action}
                        </p>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-outline font-semibold text-xs">
                    No active audit entries have been logged for this cycle yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
