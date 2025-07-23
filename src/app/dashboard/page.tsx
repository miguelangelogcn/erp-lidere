"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Galeria de Relatórios</h1>
      <p className="text-muted-foreground">Selecione um relatório para visualizar os painéis e indicadores.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link href="/dashboard/relatorios/vendas">
           <Card className="hover:shadow-lg hover:border-primary transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-3 rounded-full bg-primary/10">
                        <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Relatório de Vendas</CardTitle>
                        <CardDescription>Acompanhe o desempenho do seu funil de vendas.</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
         <Link href="/dashboard/relatorios/financeiro">
            <Card className="hover:shadow-lg hover:border-primary transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                     <div className="p-3 rounded-full bg-primary/10">
                        <PieChart className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Relatório Financeiro</CardTitle>
                        <CardDescription>Visualize a distribuição das suas despesas.</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
      </div>
    </div>
  );
}
