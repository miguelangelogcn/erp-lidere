import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function OperacoesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Operações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Página de Operações</CardTitle>
          <CardDescription>
            Funcionalidades de operações serão exibidas aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
}
