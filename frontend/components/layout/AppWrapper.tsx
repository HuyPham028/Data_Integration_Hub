'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

type AppWrapperProps = {
  children: React.ReactNode;
};

export function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false)
  const [isAuth, setIsAuth] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("access_token");

    if (!token && !isAuthPage) {
      router.push("/login");
      return;
    }

    if (token) {
      setIsAuth(true);
      if (isAuthPage) {
        router.push("/");
      }
    }
  }, [pathname, router, isAuthPage]);

  if (!mounted) {
    return <div className="flex-1 bg-slate-50" />; 
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {!isAuthPage && isAuth && <Sidebar />}
      <main className="flex-1 overflow-y-auto p-8 text-slate-900">{children}</main>
    </div>
  );
}
