import { EmployeesClient } from "./employees-client";
import { getEmployees, getRoles } from "@/lib/firebase/firestore";

export const revalidate = 0;

export default async function FuncionariosPage() {
  const employees = await getEmployees();
  const roles = await getRoles();

  return (
    <div className="space-y-4">
       <h1 className="font-headline text-3xl font-bold tracking-tight">Funcionários</h1>
      <EmployeesClient initialEmployees={employees} roles={roles} />
    </div>
  );
}
