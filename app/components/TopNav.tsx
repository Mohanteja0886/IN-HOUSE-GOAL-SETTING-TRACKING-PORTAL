'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth, mockUsers } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { fetchGoals } from '../../lib/queries/goals';
import { Goal, User } from '../types';
import Link from 'next/link';

export function TopNav() {
  const { user, login, allUsers } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Popover Toggle States
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data States
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(2);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Proactively fetch all system goals on mount to allow live global searching
  useEffect(() => {
    if (user) {
      fetchGoals()
        .then(setAllGoals)
        .catch(err => console.error('Failed to pre-fetch search index goals:', err));
    }
  }, [user]);

  if (!user) return null;

  // Toggle helpers to prevent overlapping popovers
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setHelpOpen(false);
    setMenuOpen(false);
  };

  const toggleHelp = () => {
    setHelpOpen(!helpOpen);
    setNotificationsOpen(false);
    setMenuOpen(false);
  };

  const toggleProfile = () => {
    setMenuOpen(!menuOpen);
    setNotificationsOpen(false);
    setHelpOpen(false);
  };

  const handleUserSwitch = async (userId: string, role: string) => {
    await login(userId);
    setMenuOpen(false);
    
    if (role === 'Employee') {
      router.push('/employee/dashboard');
    } else if (role === 'Manager') {
      router.push('/manager/dashboard');
    } else if (role === 'Admin') {
      router.push('/admin/dashboard');
    }
  };

  const handleQuickSwitch = () => {
    if (user.role === 'Manager') {
      handleUserSwitch('emp1', 'Employee');
    } else {
      handleUserSwitch('mgr1', 'Manager');
    }
  };

  const isSelected = (uId: string) => {
    if (uId === user.id) return true;
    const staticMap: Record<string, string> = {
      'emp1': '00000000-0000-0000-0000-000000000001',
      'emp2': '00000000-0000-0000-0000-000000000002',
      'mgr1': '00000000-0000-0000-0000-000000000003',
      'admin1': '00000000-0000-0000-0000-000000000004'
    };
    return staticMap[uId] === user.id || staticMap[user.id] === uId;
  };

  const isRouteActive = (route: string) => pathname === route;

  // Compile specific dashboards and routes
  const isManager = user.role === 'Manager' || user.role === 'Admin';
  const dashboardRoute = user.role === 'Admin' 
    ? '/admin/dashboard' 
    : user.role === 'Manager' 
      ? '/manager/dashboard' 
      : '/employee/dashboard';

  // Live query search filters matching users & objectives
  const activeUsers = allUsers.length > 0 ? allUsers : mockUsers;
  const usersMatch = searchQuery.trim().length > 0 
    ? activeUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  
  const goalsMatch = searchQuery.trim().length > 0
    ? allGoals.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.thrustArea.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <>
      <header className="bg-surface-container-lowest border-b border-outline-variant h-16 w-full fixed top-0 z-50 flex justify-between items-center px-6 md:px-8">
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Mobile Toggling Hamburger Icon Button */}
          <button 
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-1.5 -ml-1.5 rounded-full text-secondary hover:bg-surface-container-low transition-colors"
            title="Open navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <Link href="/" className="text-2xl md:text-3xl font-black text-primary tracking-tight hover:opacity-90 transition-opacity">
            GoalStream
          </Link>
          
          {user.role === 'Manager' && (
            <div className="hidden md:flex gap-2 ml-6">
              <Link href="/reports" className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-3 py-2 rounded-lg font-title-lg text-sm font-semibold">
                Explore Analytics
              </Link>
              <Link href="/manager/dashboard" className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-3 py-2 rounded-lg font-title-lg text-sm font-semibold">
                Leader Dashboard
              </Link>
              <Link href="/manager/approvals" className="text-primary font-bold border-b-2 border-primary px-3 py-2 font-title-lg text-sm">
                Roster Approvals
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          
          {/* Real-time Search Input Wrapper */}
          <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all relative">
            <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
            <input 
              className="bg-transparent border-none outline-none font-body-md placeholder:text-outline w-48 focus:ring-0 p-0 text-sm text-on-surface" 
              placeholder="Search goals, users..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Dynamic Search Matches Popover Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-2.5 z-50 max-h-80 overflow-y-auto font-sans">
                <div className="px-3 pb-1.5 mb-2 border-b border-outline-variant flex justify-between items-center">
                  <span className="text-[9px] text-outline uppercase font-bold tracking-wider">Search Matches</span>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-[9px] text-primary hover:underline font-bold"
                  >
                    Clear Search
                  </button>
                </div>
                
                {usersMatch.length > 0 && (
                  <div className="mb-3">
                    <p className="px-3 text-[9px] text-outline font-bold uppercase tracking-wider mb-1">Employees ({usersMatch.length})</p>
                    {usersMatch.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { handleUserSwitch(u.id, u.role); setSearchQuery(''); }}
                        className="w-full px-3 py-1.5 hover:bg-surface-container-low text-left flex items-center gap-2 transition-colors text-xs"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-primary truncate">{u.name}</p>
                          <p className="text-[9px] text-secondary truncate">{u.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {goalsMatch.length > 0 && (
                  <div>
                    <p className="px-3 text-[9px] text-outline font-bold uppercase tracking-wider mb-1">Objectives ({goalsMatch.length})</p>
                    {goalsMatch.map(g => {
                      const owner = activeUsers.find(u => u.id === g.employeeId);
                      return (
                        <div
                          key={g.id}
                          className="px-3 py-2 hover:bg-surface-container-low transition-colors text-[11px] text-left border-b border-outline-variant/30 last:border-b-0"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-bold text-on-surface line-clamp-1 flex-1">{g.title}</p>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-[8px] font-bold font-mono uppercase text-secondary">
                              {g.uom}
                            </span>
                          </div>
                          <p className="text-[9px] text-secondary font-medium mt-0.5 line-clamp-1">{g.description}</p>
                          <p className="text-[8px] text-primary font-bold mt-1">Owner: {owner ? owner.name : 'Unknown User'}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {usersMatch.length === 0 && goalsMatch.length === 0 && (
                  <p className="px-3 py-4 text-center text-outline text-xs font-semibold">
                    No matching users or goals found.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Switch Role Switcher */}
          <button 
            onClick={handleQuickSwitch}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors font-label-md font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            {user.role === 'Manager' ? 'Switch to Employee' : 'Switch to Manager'}
          </button>

          {/* Dynamic Action Icon Bars */}
          <div className="flex items-center gap-1">
            
            {/* Notification System Popover */}
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors relative cursor-pointer"
                title="View active notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-2.5 z-50 font-sans">
                  <div className="px-4 py-1.5 border-b border-outline-variant/60 flex justify-between items-center mb-1">
                    <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Inbox Notifications</span>
                    {notificationCount > 0 && (
                      <button 
                        onClick={() => setNotificationCount(0)}
                        className="text-[9px] text-primary hover:underline font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-outline-variant/30">
                    {notificationCount > 0 ? (
                      <>
                        <div className="px-4 py-2.5 hover:bg-surface-container-high/15 transition-colors text-xs text-secondary font-medium">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-primary">🔔 Q1 Alignment Window Open</span>
                            <span className="text-[8px] text-outline font-mono">July</span>
                          </div>
                          <p className="text-[10px] mt-1 leading-normal">The mid-year achievement logger window is now open for review. Please synchronize your Planned vs Actual targets.</p>
                        </div>
                        <div className="px-4 py-2.5 hover:bg-surface-container-high/15 transition-colors text-xs text-secondary font-medium">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-primary">🔔 Shared KPI Deployed</span>
                            <span className="text-[8px] text-outline font-mono">Just now</span>
                          </div>
                          <p className="text-[10px] mt-1 leading-normal">Your team leader has pushed a new departmental KPI template: "Improve Cloud Infrastructure Uptime".</p>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-outline text-[11px] font-semibold">
                        Your notification inbox is clean and up to date!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Help Support Desk Popover */}
            <div className="relative">
              <button 
                onClick={toggleHelp}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer mr-1 relative"
                title="Help & FAQ"
              >
                <span className="material-symbols-outlined">help</span>
              </button>

              {helpOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-4 z-50 font-sans">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2 border-b border-outline-variant/60 pb-1.5">
                    <span className="material-symbols-outlined text-[16px]">help</span>
                    GoalStream Support Center
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto text-xs text-secondary leading-relaxed font-medium">
                    <div>
                      <h5 className="font-bold text-on-surface text-[11px] mb-0.5">Q: What are the goal constraints?</h5>
                      <p className="text-[10px]">Total weightage across all goals must equal exactly 100%. Each individual goal has a minimum weight limit of 10%, with a maximum ceiling of 8 goals per employee.</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-on-surface text-[11px] mb-0.5">Q: How do shared goals work?</h5>
                      <p className="text-[10px]">Shared goals are pushed by managers/admin and cannot have their titles or targets adjusted. You can only configure the goal weightage local to your sheet.</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-on-surface text-[11px] mb-0.5">Q: How are scores computed?</h5>
                      <p className="text-[10px]">System scales: Min UoMs are calculated as Achievement ÷ Target. Max UoMs are Target ÷ Achievement. Zero-based targets reward 100% progress for zero events.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={toggleProfile}
                className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low p-1.5 rounded-lg transition-colors pl-2"
              >
                <div className="hidden sm:flex flex-col text-right pr-2">
                  <span className="font-label-md text-primary font-bold text-sm">{user.name}</span>
                  <span className="text-[10px] text-on-surface-variant">{user.title}</span>
                </div>
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-outline-variant object-cover shrink-0" 
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant">
                    <p className="text-xs text-on-surface-variant font-semibold">Switch User Profile</p>
                  </div>
                  <div className="flex flex-col max-h-80 overflow-y-auto">
                    {activeUsers.map((u) => {
                      const active = isSelected(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => handleUserSwitch(u.id, u.role)}
                          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high text-left transition-colors ${
                            active ? 'bg-secondary-container/35' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-xs font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${active ? 'text-primary' : 'text-on-surface'}`}>
                              {u.name}
                            </p>
                            <p className="text-[10px] text-on-surface-variant truncate">
                              {u.role} &bull; {u.title}
                            </p>
                          </div>
                          {active && (
                            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-outline-variant px-4 py-2 mt-1">
                    <button 
                      onClick={() => { setMenuOpen(false); router.push('/login'); }}
                      className="w-full text-center text-xs text-error font-bold hover:underline"
                    >
                      Logout Session
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE RESPONSIVE HAMBURGER NAVIGATION SLIDING DRAWER OVERLAYS */}
      {mobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {mobileDrawerOpen && (
        <div className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest border-r border-outline-variant shadow-2xl z-50 flex flex-col p-4 gap-4 animate-in slide-in-from-left duration-200 md:hidden text-on-surface font-sans">
          
          {/* Brand header */}
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-base shrink-0">
                GS
              </div>
              <div>
                <h2 className="font-semibold text-primary text-sm leading-tight">GoalStream</h2>
                <p className="text-[10px] text-secondary font-medium">Enterprise Suite</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1.5 rounded-full text-secondary hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Quick Switch Switcher for easy testing inside mobile drawer */}
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
            <p className="text-[10px] text-outline uppercase font-bold tracking-wider mb-2">Simulated Account Actions</p>
            <button 
              onClick={() => { handleQuickSwitch(); setMobileDrawerOpen(false); }}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/85 transition-colors font-bold text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              {user.role === 'Manager' ? 'Switch to Employee' : 'Switch to Manager'}
            </button>
          </div>

          {/* Sidebar drawer Links list */}
          <div className="flex flex-col gap-1 flex-grow overflow-y-auto">
            <p className="text-[10px] text-outline uppercase font-bold tracking-wider mb-1.5 px-2">System Navigation</p>
            
            <Link 
              href={dashboardRoute}
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                isRouteActive(dashboardRoute)
                  ? 'bg-secondary-container text-on-secondary-container font-bold' 
                  : 'text-secondary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </Link>

            <Link 
              href="/employee/dashboard"
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                isRouteActive('/employee/dashboard') 
                  ? 'bg-secondary-container text-on-secondary-container font-bold' 
                  : 'text-secondary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">target</span>
              <span>My Goals</span>
            </Link>

            {isManager && (
              <Link 
                href="/manager/approvals"
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                  isRouteActive('/manager/approvals') 
                    ? 'bg-secondary-container text-on-secondary-container font-bold' 
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">rate_review</span>
                <span>Approvals Hub</span>
              </Link>
            )}

            <Link 
              href="/reports"
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                isRouteActive('/reports') 
                  ? 'bg-secondary-container text-on-secondary-container font-bold' 
                  : 'text-secondary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              <span>Reports</span>
            </Link>

            <Link 
              href="/settings"
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                isRouteActive('/settings') 
                  ? 'bg-secondary-container text-on-secondary-container font-bold' 
                  : 'text-secondary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Settings</span>
            </Link>
          </div>

          {/* Mobile Roster User Badge */}
          <div className="border-t border-outline-variant/60 pt-4 flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center text-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-primary text-sm truncate">{user.name}</h4>
                <p className="text-[10px] text-secondary font-medium truncate">{user.title}</p>
              </div>
            </div>
            
            <button 
              onClick={() => { setMobileDrawerOpen(false); router.push('/login'); }}
              className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-outline-variant/80 text-xs font-bold text-error hover:bg-error/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Log Out Session
            </button>
          </div>
        </div>
      )}
    </>
  );
}
