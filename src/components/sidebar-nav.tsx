"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Cog,
  Banknote,
  ShoppingCart,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboards", icon: LayoutDashboard },
  { href: "/dashboard/gestao", label: "Gestão", icon: Briefcase },
  { href: "/dashboard/conteudo", label: "Conteúdo", icon: FileText },
  { href: "/dashboard/operacoes", label: "Operações", icon: Cog },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: Banknote },
  { href: "/dashboard/vendas", label: "Vendas", icon: ShoppingCart },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 p-2">
            <Zap className="h-6 w-6 text-primary" />
            <h2 className="font-headline text-lg font-semibold tracking-tight">Central Hub</h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
