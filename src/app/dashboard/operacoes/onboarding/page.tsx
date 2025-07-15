"use client";

import { OnboardingClient } from "./onboarding-client";

export default function OnboardingPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
         <h1 className="font-headline text-3xl font-bold tracking-tight mb-4">Onboarding de Clientes</h1>
      </div>
      <OnboardingClient />
    </div>
  );
}
