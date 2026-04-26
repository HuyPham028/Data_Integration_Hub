'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  clearAuthSession,
  getCurrentUserRole,
  hasValidSession,
  isAuthPage as checkIsAuthPage,
} from "@/lib/auth-session";

type AppWrapperProps = {
  children: React.ReactNode;
};

export function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false)
  const [isAuth, setIsAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const isAuthPage = checkIsAuthPage(pathname);
  const hideSidebar = pathname === "/data-explorers";
  const userRole = getCurrentUserRole();
  const isAdmin = userRole === 'admin';
  const isAdminRoute = !isAuthPage && pathname !== '/data-explorers';

  useEffect(() => {
    setMounted(true);
    const isValidSession = hasValidSession();
    const currentRole = getCurrentUserRole();
    const currentIsAdmin = currentRole === 'admin';

    if (!isValidSession && !isAuthPage) {
      clearAuthSession();
      setIsAuth(false);
      router.replace("/login?reason=expired");
      setIsChecking(false);
      return;
    }

    if (isValidSession) {
      setIsAuth(true);
      if (isAuthPage) {
        router.replace(currentIsAdmin ? "/" : "/data-explorers");
        setIsChecking(false);
        return;
      }

      if (!currentIsAdmin && isAdminRoute) {
        router.replace("/data-explorers?reason=forbidden");
        setIsChecking(false);
        return;
      }
    } else {
      setIsAuth(false);
    }

    setIsChecking(false);
  }, [pathname, router, isAuthPage, isAdminRoute]);

  if (!mounted || isChecking) {
    return <div className="flex-1 bg-slate-50" />; 
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {!isAuthPage && !hideSidebar && isAuth && <Sidebar isAdmin={isAdmin} />}
      <main className="flex-1 overflow-y-auto p-8 pb-0 text-slate-900">{children}</main>
    </div>
  );
}
