"use client";

import { AccountsClient } from "./accounts-client";

export default function ContasPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Contas</h1>
      <p className="text-muted-foreground">Gerencie suas contas a pagar e a receber.</p>
      <AccountsClient />
    </div>
  );
}
