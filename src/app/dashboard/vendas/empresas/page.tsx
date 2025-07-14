import { CompaniesClient } from "./companies-client";

export default function EmpresasPage() {
  return (
    <div className="space-y-4">
       <h1 className="font-headline text-3xl font-bold tracking-tight">Empresas</h1>
      <CompaniesClient />
    </div>
  );
}
