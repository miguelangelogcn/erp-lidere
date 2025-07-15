"use client";

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
    if (!loading && userRole && userRole !== 'student') {
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

  // The main layout is already handled by src/app/dashboard/layout.tsx
  // This layout only needs to enforce the role and render children.
  return <>{children}</>;
}
