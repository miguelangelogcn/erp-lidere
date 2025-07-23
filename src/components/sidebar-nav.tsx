"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FileText,
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
  GraduationCap,
  User,
  Wallet,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const employeeNavItems = [
  { href: "/dashboard", label: "Relatórios", icon: LayoutDashboard },
  { href: "/dashboard/formacoes", label: "Minhas Formações", icon: GraduationCap },
  { 
    id: "gestao",
    label: "Gestão", 
    subItems: [
      { href: "/dashboard/gestao/funcionarios", label: "Funcionários", icon: Users },
      { href: "/dashboard/gestao/alunos", label: "Alunos", icon: User },
      { href: "/dashboard/gestao/cargos", label: "Cargos", icon: Building2 },
    ]
  },
  { 
    id: "conteudo",
    label: "Conteúdo", 
    subItems: [
      { href: "/dashboard/conteudo/formacoes", label: "Formações", icon: GraduationCap },
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
       { href: "/dashboard/financeiro/contas", label: "Contas", icon: Wallet },
       { href: "/dashboard/financeiro/dividas", label: "Dívidas", icon: Landmark },
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

const studentNavItems = [
    { href: "/dashboard/formacoes", label: "Formações", icon: GraduationCap },
    { href: "/dashboard/acompanhamento", label: "Acompanhamento", icon: ClipboardCheck },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { userRole } = useAuth();
  
  const navItems = userRole === 'student' ? studentNavItems : employeeNavItems;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
       <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Zap className="h-6 w-6 text-primary" />
          <span className="">Lidere University</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          'subItems' in item ? (
            <div key={item.id} className="space-y-1">
              <h4 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{item.label}</h4>
              <ul className="space-y-1">
                {item.subItems.map((subItem) => (
                  <li key={subItem.href}>
                    <Link
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        (pathname === subItem.href || pathname.startsWith(subItem.href + '/'))
                         ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        ))}
      </nav>
    </div>
  );
}
