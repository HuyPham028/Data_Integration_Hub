'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { clearAuthSession, hasValidSession, isAuthPage as checkIsAuthPage } from "@/lib/auth-session";

type AppWrapperProps = {
  children: React.ReactNode;
};

export function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false)
  const [isAuth, setIsAuth] = useState(false);

  const isAuthPage = checkIsAuthPage(pathname);
  const hideSidebar = pathname === "/data-explorers";

  useEffect(() => {
    setMounted(true);
    const isValidSession = hasValidSession();

    if (!isValidSession && !isAuthPage) {
      clearAuthSession();
      setIsAuth(false);
      router.replace("/login?reason=expired");
      return;
    }

    if (isValidSession) {
      setIsAuth(true);
      if (isAuthPage) {
        router.replace("/");
      }
      return;
    }

    setIsAuth(false);
  }, [pathname, router, isAuthPage]);

  if (!mounted) {
    return <div className="flex-1 bg-slate-50" />; 
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {!isAuthPage && !hideSidebar && isAuth && <Sidebar />}
      <main className="flex-1 overflow-y-auto p-8 pb-0 text-slate-900">{children}</main>
    </div>
  );
}
