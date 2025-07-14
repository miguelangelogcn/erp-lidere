
import { StudentsClient } from "./students-client";

export default function AlunosPage() {
  return (
    <div className="space-y-4">
       <h1 className="font-headline text-3xl font-bold tracking-tight">Alunos</h1>
       <p className="text-muted-foreground">Gerencie os alunos e seus acessos aos cursos.</p>
      <StudentsClient />
    </div>
  );
}

    