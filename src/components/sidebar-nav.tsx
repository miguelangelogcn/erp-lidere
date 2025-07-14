"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Cog,
  Banknote,
  ShoppingCart,
  Zap,
  Users,
  Building2,
  Contact,
  Building,
  KanbanSquare,
  Package,
  ClipboardCheck,
  PlaySquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { 
    id: "gestao",
    label: "Gestão", 
    subItems: [
      { href: "/dashboard/gestao/funcionarios", label: "Funcionários", icon: Users },
      { href: "/dashboard/gestao/cargos", label: "Cargos", icon: Building2 },
    ]
  },
  { 
    id: "conteudo",
    label: "Conteúdo", 
    subItems: [
      { href: "/dashboard/conteudo", label: "Visão Geral", icon: FileText },
    ]
  },
  { 
    id: "operacoes",
    label: "Operações", 
    subItems: [
       { href: "/dashboard/operacoes/produtos", label: "Gerenciar Produtos", icon: Package },
       { href: "/dashboard/operacoes/onboarding", label: "Onboarding", icon: PlaySquare },
       { href: "/dashboard/operacoes/acompanhamento", label: "Acompanhamento", icon: ClipboardCheck },
    ]
  },
  { 
    id: "financeiro",
    label: "Financeiro", 
    subItems: [
       { href: "/dashboard/financeiro", label: "Visão Geral", icon: Banknote },
    ]
  },
  { 
    id: "vendas",
    label: "Vendas", 
    subItems: [
      { href: "/dashboard/vendas/contatos", label: "Contatos", icon: Contact },
      { href: "/dashboard/vendas/empresas", label: "Empresas", icon: Building },
      { href: "/dashboard/vendas/pipelines", label: "Pipelines", icon: KanbanSquare },
    ]
  },
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
            <div key={item.id || item.href} className="space-y-1">
              {item.label !== 'Dashboard' && (
                <h4 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{item.label}</h4>
              )}
              <ul className="space-y-1">
                {item.subItems.map((subItem) => (
                  <li key={subItem.href}>
                    <Link href={subItem.href} passHref>
                      <a
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          (pathname.startsWith(subItem.href))
                           ? "bg-muted text-foreground" : ""
                        )}
                      >
                        <subItem.icon className="h-4 w-4" />
                        {subItem.label}
                      </a>
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
