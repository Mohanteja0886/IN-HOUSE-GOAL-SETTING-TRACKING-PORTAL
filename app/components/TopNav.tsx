'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth, mockUsers } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function TopNav() {
  const { user, login, allUsers } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(2);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

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


  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant h-16 w-full fixed top-0 z-50 flex justify-between items-center px-6 md:px-8">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-headline-md font-black text-primary hover:opacity-90 transition-opacity">
          GoalStream
        </Link>
        {user.role === 'Manager' && (
          <div className="hidden md:flex gap-2 ml-6">
            <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-3 py-2 rounded-lg font-title-lg text-sm font-semibold">
              Explore
            </button>
            <Link href="/manager/dashboard" className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-3 py-2 rounded-lg font-title-lg text-sm font-semibold">
              Dashboard
            </Link>
            <button className="text-primary font-bold border-b-2 border-primary px-3 py-2 font-title-lg text-sm">
              Team Overview
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
          <input 
            className="bg-transparent border-none outline-none font-body-md placeholder:text-outline w-48 focus:ring-0 p-0 text-sm text-on-surface" 
            placeholder="Search goals, users..." 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Role Switcher Button */}
        <button 
          onClick={handleQuickSwitch}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors font-label-md font-bold text-xs"
        >
          <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          {user.role === 'Manager' ? 'Switch to Sarah' : 'Switch to Manager'}
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setNotificationCount(0)}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors relative cursor-pointer"
            title="Clear notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            )}
          </button>
          
          <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer mr-1">
            <span className="material-symbols-outlined">help</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low p-1.5 rounded-lg transition-colors pl-2"
            >
              <div className="hidden sm:flex flex-col text-right pr-2">
                <span className="font-label-md text-primary font-bold text-sm">{user.name}</span>
                <span className="text-[10px] text-on-surface-variant">{user.title}</span>
              </div>
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-8 h-8 rounded-full border border-outline-variant object-cover" 
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-outline-variant">
                  <p className="text-xs text-on-surface-variant font-semibold">Switch User Profile</p>
                </div>
                <div className="flex flex-col max-h-80 overflow-y-auto">
                  {(allUsers.length > 0 ? allUsers : mockUsers).map((u) => {
                    const active = isSelected(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleUserSwitch(u.id, u.role)}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high text-left transition-colors ${
                          active ? 'bg-secondary-container/35' : ''
                        }`}
                      >
                        <img 
                          src={u.avatar} 
                          alt={u.name} 
                          className="w-8 h-8 rounded-full object-cover border border-outline-variant" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${active ? 'text-primary' : 'text-on-surface'}`}>
                            {u.name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant truncate">
                            {u.role} &bull; {u.title}
                          </p>
                        </div>
                        {active && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
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
                    Logout Option
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
