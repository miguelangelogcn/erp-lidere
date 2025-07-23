
"use client";

import { DebtsClient } from "./debts-client";

export default function DividasPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Dívidas</h1>
      <p className="text-muted-foreground">Gerencie as dívidas e obrigações financeiras.</p>
      <DebtsClient />
    </div>
  );
}
