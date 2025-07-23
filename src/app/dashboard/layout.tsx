"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserNav } from "@/components/user-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthGuard>
      <div className={`grid min-h-screen w-full ${isCollapsed ? 'grid-cols-[80px_1fr]' : 'grid-cols-[240px_1fr]'} transition-all duration-300`}>
        <SidebarNav isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 bg-background px-4 sm:px-6">
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
