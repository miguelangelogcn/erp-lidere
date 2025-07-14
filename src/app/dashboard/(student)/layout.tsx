
"use client";

import { AuthGuard } from "@/components/auth-guard";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userRole !== 'student') {
        // Redirect non-students trying to access student pages
        router.push('/dashboard');
    }
  }, [userRole, loading, router]);


  if (loading || userRole !== 'student') {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 animate-spin text-primary" ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        </div>
      )
  }

  return (
    <AuthGuard>
      <div className="grid min-h-screen w-full grid-cols-[240px_1fr]">
        <div className="flex flex-col border-r bg-background">
          <SidebarNav />
        </div>
        <div className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-4 sm:px-6">
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

    