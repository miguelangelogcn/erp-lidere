"use client";

import { DisparosClient } from "./disparos-client";

export default function DisparosPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Disparos de Marketing</h1>
       <p className="text-muted-foreground">Envie e-mails e mensagens de WhatsApp para seus contatos.</p>
      <DisparosClient />
    </div>
  );
}
