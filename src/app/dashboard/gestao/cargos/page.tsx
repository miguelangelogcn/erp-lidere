import { RolesClient } from "./roles-client";
import { getRoles } from "@/lib/firebase/firestore";

export const revalidate = 0;

export default async function CargosPage() {
  const roles = await getRoles();

  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Cargos</h1>
      <RolesClient initialData={roles} />
    </div>
  );
}
