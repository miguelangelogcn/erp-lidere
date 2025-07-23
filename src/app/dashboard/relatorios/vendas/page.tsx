
"use client";

import { SalesFunnelChart } from './sales-funnel-chart';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function SalesReportPage() {
  return (
    <div className="space-y-6">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard">Relatórios</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Vendas</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
      <h1 className="font-headline text-3xl font-bold tracking-tight">Relatório de Vendas</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <SalesFunnelChart />
      </div>
    </div>
  );
}
