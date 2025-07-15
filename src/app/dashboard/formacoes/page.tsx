
import { CoursesClient } from "./courses-client";

export default function FormacoesPage() {
  return (
    <div className="space-y-6">
      <div
        className="w-full h-[350px] bg-cover bg-center rounded-lg"
        style={{
          backgroundImage:
            "url('https://firebasestorage.googleapis.com/v0/b/lidere-8dq24.firebasestorage.app/o/imagens-23748.png?alt=media&token=6551c88f-427d-4e60-8104-d84fbc937f95')",
        }}
        data-ai-hint="student education"
      />
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Minhas Formações</h1>
        <p className="text-muted-foreground mt-2">Cursos e formações disponíveis para você.</p>
      </div>
      <CoursesClient />
    </div>
  );
}
