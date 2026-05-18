'use client';

import { useEffect } from 'react';
import { useAuth, mockUsers } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'Employee') {
        router.push('/employee/dashboard');
      } else if (user.role === 'Manager') {
        router.push('/manager/dashboard');
      } else if (user.role === 'Admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);

  const handleLogin = async (id: string, role: string) => {
    await login(id);
    if (role === 'Employee') {
      router.push('/employee/dashboard');
    } else if (role === 'Manager') {
      router.push('/manager/dashboard');
    } else if (role === 'Admin') {
      router.push('/admin/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-surface-container-low px-4 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-primary tracking-wide">Authenticating active session...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface-container-low px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-md transition-all duration-300">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
            GS
          </div>
          <h1 className="font-headline-lg text-primary text-2xl font-bold mt-4">GoalStream Portal</h1>
          <p className="text-on-surface-variant font-body-md mt-2 text-sm">
            Select an enterprise role to log into your tracking dashboard.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          {mockUsers.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLogin(item.id, item.role)}
              className="flex items-center gap-4 p-4 border border-outline-variant rounded-xl hover:bg-surface-container-high hover:border-primary/50 transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
            >
              <img 
                src={item.avatar} 
                alt={item.name} 
                className="w-12 h-12 rounded-full object-cover border border-outline-variant/60 group-hover:border-primary transition-colors" 
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-primary group-hover:text-primary-fixed-dim transition-colors truncate">
                  {item.name}
                </div>
                <div className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">
                  {item.title}
                </div>
                <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                  {item.role}
                </span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors pr-1">
                login
              </span>
            </button>
          ))}
        </div>
        <div className="mt-8 text-center text-xs text-outline font-medium">
          &copy; {new Date().getFullYear()} GoalStream Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
