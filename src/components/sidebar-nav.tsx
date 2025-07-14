"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Cog,
  Banknote,
  ShoppingCart,
  Zap,
  Users,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboards", icon: LayoutDashboard },
  { 
    id: "gestao",
    label: "Gestão", 
    icon: Briefcase,
    subItems: [
      { href: "/dashboard/gestao/funcionarios", label: "Funcionários", icon: Users },
      { href: "/dashboard/gestao/cargos", label: "Cargos", icon: Building2 },
    ]
  },
  { href: "/dashboard/conteudo", label: "Conteúdo", icon: FileText },
  { href: "/dashboard/operacoes", label: "Operações", icon: Cog },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: Banknote },
  { href: "/dashboard/vendas", label: "Vendas", icon: ShoppingCart },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
       <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Zap className="h-6 w-6 text-primary" />
          <span className="">Central Hub</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          item.subItems ? (
            <div key={item.id} className="space-y-1">
              <h4 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{item.label}</h4>
              <ul className="space-y-1">
                {item.subItems.map((subItem) => (
                  <li key={subItem.href}>
                    <Link href={subItem.href}>
                      <span
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          pathname === subItem.href && "bg-muted text-foreground"
                        )}
                      >
                        <subItem.icon className="h-4 w-4" />
                        {subItem.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Link key={item.href} href={item.href!}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  pathname === item.href && "bg-muted text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          )
        ))}
      </nav>
    </div>
  );
}
