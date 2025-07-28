
import { FieldsClient } from "./fields-client";

export default function SettingsEmployeesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Campos Customizáveis</h1>
      <p className="text-muted-foreground">
        Gerencie os campos de dados adicionais para os funcionários da plataforma.
      </p>
      <FieldsClient />
    </div>
  );
}
