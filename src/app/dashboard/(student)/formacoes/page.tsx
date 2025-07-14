
import { StudentCoursesClient } from "./courses-client";

export default function StudentFormacoesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Minhas Formações</h1>
      <p className="text-muted-foreground">Cursos e formações disponíveis para você.</p>
      <StudentCoursesClient />
    </div>
  );
}

    