'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGoals } from '../../context/GoalContext';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  const { resetGoals } = useGoals();
  
  // Settings States (Persisted or simulated with local state)
  const [activePeriod, setActivePeriod] = useState('Q3 Check-in (January)');
  const [escalationDaysSubmission, setEscalationDaysSubmission] = useState('5');
  const [escalationDaysApproval, setEscalationDaysApproval] = useState('7');
  const [escalationDaysCheckin, setEscalationDaysCheckin] = useState('10');
  const [enableTeamsBot, setEnableTeamsBot] = useState(true);
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(true);
  const [enableEntraSync, setEnableEntraSync] = useState(true);
  
  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncLog, setSyncLog] = useState<string[]>([
    'System initialized standard reporting hierarchy.',
    'Awaiting Microsoft Entra ID SSO sync trigger...'
  ]);

  // Load persisted states on mount
  useEffect(() => {
    const savedPeriod = localStorage.getItem('goalstream_active_period');
    if (savedPeriod) setActivePeriod(savedPeriod);

    const savedEscSub = localStorage.getItem('goalstream_esc_sub');
    if (savedEscSub) setEscalationDaysSubmission(savedEscSub);

    const savedEscApp = localStorage.getItem('goalstream_esc_app');
    if (savedEscApp) setEscalationDaysApproval(savedEscApp);

    const savedTeams = localStorage.getItem('goalstream_teams_enabled');
    if (savedTeams) setEnableTeamsBot(savedTeams === 'true');

    const savedEmails = localStorage.getItem('goalstream_emails_enabled');
    if (savedEmails) setEnableEmailAlerts(savedEmails === 'true');
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API persistence delay
    setTimeout(() => {
      localStorage.setItem('goalstream_active_period', activePeriod);
      localStorage.setItem('goalstream_esc_sub', escalationDaysSubmission);
      localStorage.setItem('goalstream_esc_app', escalationDaysApproval);
      localStorage.setItem('goalstream_teams_enabled', enableTeamsBot ? 'true' : 'false');
      localStorage.setItem('goalstream_emails_enabled', enableEmailAlerts ? 'true' : 'false');
      
      setIsSaving(false);
      triggerToast('Configurations saved successfully! Live system cycle settings updated.');
    }, 800);
  };

  const handleTriggerEntraSync = () => {
    setIsSyncing(true);
    setSyncLog(prev => [...prev, 'Starting active synchronization with Microsoft Entra ID tenant...']);
    
    setTimeout(() => {
      setSyncLog(prev => [
        ...prev, 
        'Connected to tenant: goalstream.onmicrosoft.com',
        'Syncing 4 user profiles (Sarah, Michael, Manager L1, Admin)...',
        'Updated reporting hierarchy: Sarah -> Manager, Michael -> Manager.'
      ]);
    }, 1000);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncLog(prev => [...prev, '🟢 Microsoft Entra ID Sync successfully finished. hierarchy fully aligned!']);
      triggerToast('Azure AD SSO User Profile Sync completed successfully!');
    }, 2000);
  };

  const handleResetSystem = () => {
    if (confirm('Are you sure you want to restore all goal trajectory and comments to their original seeded states?')) {
      resetGoals();
      triggerToast('System database states reset successfully.');
    }
  };

  if (!user) {
    return (
      <div className="md:pl-64 pt-24 min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm font-semibold text-outline">Awaiting authentication authorization...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'Admin' || user.role === 'Manager';

  return (
    <main className="md:pl-64 pt-24 pb-8 min-h-screen flex-grow relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface text-xs font-bold px-4 py-3.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-250 border border-outline-variant/30">
          <span className="material-symbols-outlined text-[#4caf50] text-[18px]">check_circle</span>
          {toastMessage}
        </div>
      )}

      <div className="p-6 md:p-8 max-w-[1100px] mx-auto flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/40 pb-5">
          <div>
            <h1 className="font-headline-lg text-primary text-3xl font-bold">System Settings</h1>
            <p className="text-on-surface-variant font-body-md mt-1 text-sm">
              Configure organizational check-in periods, rule-based escalations, and Azure AD integration profiles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary-container text-on-primary-container font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {user.role} View
            </span>
          </div>
        </div>

        {/* Settings Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <form onSubmit={handleSaveConfigs} className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Cycle Schedule Panel */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-surface-container-high pb-3">
                <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-primary font-bold text-base leading-tight">Cycle Schedule & Review Windows</h2>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Control active operational check-in windows</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">Active Cycle Window</label>
                  <div className="relative">
                    <select
                      value={activePeriod}
                      onChange={e => setActivePeriod(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full appearance-none bg-surface border border-outline rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-10 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="Phase 1 — Goal Setting (1st May)">Phase 1 — Goal Setting (1st May)</option>
                      <option value="Q1 Check-in (July)">Q1 Check-in (July)</option>
                      <option value="Q2 Check-in (October)">Q2 Check-in (October)</option>
                      <option value="Q3 Check-in (January)">Q3 Check-in (January)</option>
                      <option value="Q4 / Annual (March / April)">Q4 / Annual (March / April)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="md:col-span-6 flex flex-col justify-end">
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {!isAdmin ? (
                      <span className="text-error font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Locked to Admin access. Please consult hierarchy skipped L1 manager.
                      </span>
                    ) : (
                      "Selecting an active window locks other quarters and directs employee-facing targets to match this schedule timeframe."
                    )}
                  </p>
                </div>
              </div>

              {/* Checkin visual timeline */}
              <div className="mt-4 pt-4 border-t border-outline-variant/30">
                <p className="text-xs font-bold text-primary mb-3">Hackathon Schedule Windows</p>
                <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold text-on-surface-variant">
                  {[
                    { label: 'Phase 1', desc: 'Goal Setting', active: activePeriod.includes('Phase 1') },
                    { label: 'Q1 Check-in', desc: 'July Window', active: activePeriod.includes('Q1') },
                    { label: 'Q2 Check-in', desc: 'October Window', active: activePeriod.includes('Q2') },
                    { label: 'Q3 Check-in', desc: 'January Window', active: activePeriod.includes('Q3') },
                    { label: 'Q4 Check-in', desc: 'March / April', active: activePeriod.includes('Q4') },
                  ].map((x, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-lg border flex flex-col justify-between h-16 transition-all ${
                        x.active 
                          ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32] shadow-sm font-bold scale-[1.03]' 
                          : 'bg-surface border-outline-variant/30 opacity-60'
                      }`}
                    >
                      <p className="uppercase tracking-wide leading-none">{x.label}</p>
                      <p className="opacity-80 text-[8px] leading-tight mt-1">{x.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Rule-Based Escalation Panel */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-surface-container-high pb-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-primary font-bold text-base leading-tight">Rule-Based Escalation Module</h2>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Define SLA alerts for submission and manager checks</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Submission SLA Limit</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={escalationDaysSubmission}
                      onChange={e => setEscalationDaysSubmission(e.target.value)}
                      disabled={!isAdmin}
                      min="1"
                      className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-12 text-right disabled:opacity-60"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant pointer-events-none">DAYS</span>
                  </div>
                  <p className="text-[9px] text-on-surface-variant mt-1.5 leading-snug">Auto-escalates non-submissions to L1 Manager.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">L1 Approval SLA Limit</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={escalationDaysApproval}
                      onChange={e => setEscalationDaysApproval(e.target.value)}
                      disabled={!isAdmin}
                      min="1"
                      className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-12 text-right disabled:opacity-60"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant pointer-events-none">DAYS</span>
                  </div>
                  <p className="text-[9px] text-on-surface-variant mt-1.5 leading-snug">Escalates pending L1 approvals to skip-level / HR.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Check-in SLA Limit</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={escalationDaysCheckin}
                      onChange={e => setEscalationDaysCheckin(e.target.value)}
                      disabled={!isAdmin}
                      min="1"
                      className="w-full bg-surface border border-outline rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-12 text-right disabled:opacity-60"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant pointer-events-none">DAYS</span>
                  </div>
                  <p className="text-[9px] text-on-surface-variant mt-1.5 leading-snug">Flags missed check-in windows on Completion dashboard.</p>
                </div>
              </div>
            </section>

            {/* Notification Integrations Panel */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-surface-container-high pb-3">
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-primary font-bold text-base leading-tight">Notification Channels Configuration</h2>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Toggle automated email and MS Teams bot dispatches</p>
                </div>
              </div>

              <div className="space-y-3.5 mt-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outline-variant/30">
                  <div>
                    <h3 className="text-xs font-bold text-primary">Microsoft Teams Adaptive Cards Integration</h3>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Sends automated adaptive cards to L1 managers upon draft submissions.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableTeamsBot} 
                      onChange={e => setEnableTeamsBot(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outline-variant/30">
                  <div>
                    <h3 className="text-xs font-bold text-primary">SLA Automated Email Reminders</h3>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Triggers daily emails to pending appraisers when SLA limits are breached.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableEmailAlerts} 
                      onChange={e => setEnableEmailAlerts(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Action buttons */}
            {isAdmin && (
              <div className="flex items-center gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={handleResetSystem}
                  className="px-5 py-2.5 rounded-xl font-label-md font-bold text-xs bg-surface border border-outline-variant text-error hover:bg-error-container hover:text-on-error-container transition-all cursor-pointer"
                >
                  Reset Trajectory Logs
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl font-label-md font-bold text-xs bg-primary text-on-primary hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-55"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Save Configurations
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Right Integration Sidebar panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Microsoft Entra ID Sync Panel */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[120px] text-primary opacity-5 pointer-events-none">
                sync_alt
              </span>
              <div className="flex items-center gap-3 border-b border-surface-container-high pb-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-primary font-bold text-base leading-none">Microsoft Entra ID</h2>
                  <p className="text-[9px] text-on-surface-variant mt-1 uppercase tracking-wide font-bold">Azure AD SSO Sync</p>
                </div>
              </div>

              <div className="relative z-10 mt-1 flex flex-col gap-3">
                <p className="text-xs font-body-md text-on-surface-variant leading-relaxed">
                  Derived active organizational hierarchy and reporting lines directly from Entra ID attributes:
                </p>

                <div className="bg-surface rounded-xl p-3.5 border border-outline-variant/35 text-[10px] font-semibold text-on-surface-variant flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span>Tenant ID</span>
                    <span className="font-mono text-[9px] bg-surface-container-high px-1.5 py-0.5 rounded">gs-ad-7f023</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Hierarchy Sync</span>
                    <span className="text-[#2e7d32] font-bold">Enabled</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerEntraSync}
                  disabled={isSyncing}
                  className="w-full mt-2 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer disabled:opacity-55"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Synchronizing Entra ID...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Trigger Entra ID Sync
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Sync Console Logs */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
              <h2 className="font-title-lg text-primary font-bold text-base border-b border-surface-container-high pb-3 mb-3">
                SSO & System Logs
              </h2>
              <div className="bg-surface-container-high/30 rounded-xl p-3.5 border border-outline-variant flex-1 font-mono text-[9px] text-on-surface-variant leading-relaxed space-y-2 overflow-y-auto max-h-56">
                {syncLog.map((log, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start">
                    <span className="text-outline shrink-0">&bull;</span>
                    <p className="truncate-2-lines">{log}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
