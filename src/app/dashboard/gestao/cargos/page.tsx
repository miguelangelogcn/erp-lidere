import { RolesClient } from "./roles-client";

export default function CargosPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Cargos</h1>
      <RolesClient />
    </div>
  );
}
