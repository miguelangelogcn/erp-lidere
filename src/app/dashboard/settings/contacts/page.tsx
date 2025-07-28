
import FieldsClient from "./fields-client";

export default function SettingsContactsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Campos Customizáveis de Contato</h1>
      <p className="text-muted-foreground">
        Gerencie os campos de dados adicionais para os contatos da plataforma.
      </p>
      <FieldsClient />
    </div>
  );
}
