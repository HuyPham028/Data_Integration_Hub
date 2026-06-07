'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Activity, Network, Clock, Shield, DatabaseBackup, TableProperties, ServerCog } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

type SidebarProps = {
  isAdmin: boolean;
};

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Job Scheduler', href: '/scheduler', icon: Clock },
  { name: 'Access Control', href: '/access-control', icon: Shield },
  { name: 'Schema Registry', href: '/schemas', icon: Database },
  { name: 'Sync History', href: '/sync-logs', icon: Activity },
  { name: 'Backup', href: '/backup', icon: DatabaseBackup },
  { name: 'Source Config', href: '/source_config', icon: ServerCog },
  { name: 'API Gateway (Kong)', href: '/gateway', icon: Network },
];

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();

  const navItems = [
    { key: 'nav.dashboard', href: '/', icon: LayoutDashboard },
    { key: 'nav.scheduler', href: '/scheduler', icon: Clock },
    { key: 'nav.access', href: '/access-control', icon: Shield },
    { key: 'nav.schema', href: '/schemas', icon: Database },
    { key: 'nav.syncHistory', href: '/sync-logs', icon: Activity },
    { key: 'nav.backup', href: '/backup', icon: DatabaseBackup },
    { key: 'nav.sourceConfig', href: '/source_config', icon: ServerCog },
    { key: 'nav.dataMgmt', href: '/data-management', icon: TableProperties },
    { key: 'nav.gateway', href: '/gateway', icon: Network },
  ] as const;

  const visibleNavItems = isAdmin ? navItems : [];

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
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
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

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Capstone Project © 2026
      </div>
    </div>
  );
}
