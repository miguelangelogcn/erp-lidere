import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Central Hub!</CardTitle>
          <CardDescription>
            Este é o seu painel de controle. Navegue pelo menu lateral para acessar as diferentes seções.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>As funcionalidades de cada seção serão implementadas em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
