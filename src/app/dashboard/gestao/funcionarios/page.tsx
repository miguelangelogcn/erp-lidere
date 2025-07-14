import { EmployeesClient } from "./employees-client";

export default function FuncionariosPage() {
  return (
    <div className="space-y-4">
       <h1 className="font-headline text-3xl font-bold tracking-tight">Funcionários</h1>
      <EmployeesClient />
    </div>
  );
}
