import { AuthGuard } from "@/components/auth-guard";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserNav } from "@/components/user-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="grid min-h-screen w-full grid-cols-[240px_1fr]">
        <div className="flex flex-col bg-sidebar">
          <SidebarNav />
        </div>
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
