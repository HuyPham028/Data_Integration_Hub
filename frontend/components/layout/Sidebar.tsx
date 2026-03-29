'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Activity, Network, LogOut, Clock } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Job Scheduler', href: '/scheduler', icon: Clock},
  { name: 'Schema Registry', href: '/schemas', icon: Database },
  { name: 'Sync History', href: '/sync-logs', icon: Activity },
  { name: 'API Gateway (Kong)', href: '/gateway', icon: Network },
];

export function Sidebar() {
  const pathname = usePathname();
  const handleLogOut = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider">UNIV HUB</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogOut}
          className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Đăng xuất
        </button>
      </div>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Capstone Project © 2025
      </div>
    </div>
  );
}