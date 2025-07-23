
"use client";

import { SalesFunnelChart } from './sales-funnel-chart';
import { ExpensesByCategoryChart } from './expenses-by-category-chart';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesFunnelChart />
        <ExpensesByCategoryChart />
      </div>
    </div>
  );
}
