
import { CoursesClient } from "./courses-client";

export default function FormacoesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Formações</h1>
      <p className="text-muted-foreground">Crie e gerencie os cursos da plataforma.</p>
      <CoursesClient />
    </div>
  );
}

    