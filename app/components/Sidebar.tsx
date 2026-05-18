'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showNotification = (feature: string) => {
    alert(`${feature} is simulated for this preview cycle. Perfect end-to-end objective planning is fully operational!`);
  };

  const isManager = user.role === 'Manager' || user.role === 'Admin';
  
  // Dynamic dashboard route based on role
  const dashboardRoute = user.role === 'Admin' 
    ? '/admin/dashboard' 
    : user.role === 'Manager' 
      ? '/manager/dashboard' 
      : '/employee/dashboard';

  const isRouteActive = (route: string) => pathname === route;

  return (
    <nav className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface border-r border-outline-variant flex-col p-4 gap-4 z-40">
      {/* Brand Profile Banner */}
      <div className="mb-4 px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
            GS
          </div>
          <div>
            <h2 className="font-semibold text-primary text-sm leading-tight">GoalStream</h2>
            <p className="text-[10px] text-secondary font-medium">Enterprise Suite</p>
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        {user.role === 'Employee' ? (
          <Link 
            href="/employee/goals/new" 
            className="flex w-full mt-4 bg-primary text-on-primary text-xs font-semibold py-3 rounded-xl items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Goal Sheet
          </Link>
        ) : (
          <button 
            onClick={() => router.push('/employee/goals/new')}
            className="w-full mt-4 bg-primary text-on-primary text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Goal Sheet
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <div className="flex flex-col gap-1 flex-1">
        <Link 
          href={dashboardRoute}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
            isRouteActive('/employee/dashboard') || isRouteActive('/manager/dashboard') || isRouteActive('/admin/dashboard')
              ? 'bg-secondary-container text-on-secondary-container font-bold' 
              : 'text-secondary hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            dashboard
          </span>
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href={user.role === 'Employee' ? '/employee/dashboard' : '/manager/dashboard'}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
            isRouteActive('/employee/dashboard#goals') 
              ? 'bg-secondary-container text-on-secondary-container font-bold' 
              : 'text-secondary hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined">target</span>
          <span>My Goals</span>
        </Link>

        {isManager ? (
          <Link 
            href="/manager/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
              isRouteActive('/manager/dashboard') 
                ? 'bg-secondary-container text-on-secondary-container font-bold' 
                : 'text-secondary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">group</span>
            <span>Team Progress</span>
          </Link>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 text-outline opacity-60 cursor-not-allowed rounded-xl text-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">group</span>
              <span>Team Progress</span>
            </div>
            <span className="material-symbols-outlined text-[14px]">lock</span>
          </div>
        )}

        <button 
          onClick={() => showNotification('Performance Reports')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-surface-container-high transition-all text-sm text-left w-full"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span>Reports</span>
        </button>

        <button 
          onClick={() => showNotification('System Settings')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-surface-container-high transition-all text-sm text-left w-full"
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </button>
      </div>

      {/* Footer Navigation section */}
      <div className="flex flex-col gap-1 pt-4 border-t border-outline-variant mt-2">
        <Link 
          href="/admin/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
            isRouteActive('/admin/dashboard')
              ? 'bg-secondary-container text-on-secondary-container font-bold' 
              : 'text-secondary hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          <span>Admin Panel</span>
        </Link>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container rounded-xl transition-colors text-sm text-left w-full mt-1"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
