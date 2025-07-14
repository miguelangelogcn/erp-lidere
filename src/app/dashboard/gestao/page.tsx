import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function GestaoPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Gestão</h1>
      <Card>
        <CardHeader>
          <CardTitle>Página de Gestão</CardTitle>
          <CardDescription>
            Funcionalidades de gestão serão exibidas aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
}
