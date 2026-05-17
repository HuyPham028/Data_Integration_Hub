'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Activity, Network, LogOut, Clock, Shield, DatabaseBackup, Globe, TableProperties } from 'lucide-react';
import { clearAuthSession } from '@/lib/auth-session';
import { useLanguage } from '@/lib/i18n';

type SidebarProps = {
  isAdmin: boolean;
};

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();

  const navItems = [
    { key: 'nav.dashboard', href: '/',               icon: LayoutDashboard },
    { key: 'nav.scheduler', href: '/scheduler',       icon: Clock },
    { key: 'nav.access',    href: '/access-control',  icon: Shield },
    { key: 'nav.schema',    href: '/schemas',          icon: Database },
    { key: 'nav.syncHistory', href: '/sync-logs',        icon: Activity },
    { key: 'nav.backup',    href: '/backup',            icon: DatabaseBackup },
    { key: 'nav.dataMgmt',  href: '/data-management',  icon: TableProperties },
    { key: 'nav.gateway',   href: '/gateway',           icon: Network },
  ] as const;

  const visibleNavItems = isAdmin ? navItems : [];

  const handleLogOut = () => {
    clearAuthSession();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider">UNIV HUB</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Language toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <div className="flex items-center">
            <Globe className="mr-3 h-4 w-4" />
            {lang === 'vi' ? 'Tiếng Việt' : 'English'}
          </div>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded font-mono">
            {lang === 'vi' ? 'EN' : 'VI'}
          </span>
        </button>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogOut}
          className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t('nav.logout')}
        </button>
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Capstone Project © 2025
      </div>
    </div>
  );
}
