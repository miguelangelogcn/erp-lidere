import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function FinanceiroPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Financeiro</h1>
      <Card>
        <CardHeader>
          <CardTitle>Página Financeira</CardTitle>
          <CardDescription>
            Funcionalidades financeiras serão exibidas aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
}
