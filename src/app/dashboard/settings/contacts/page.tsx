
import FieldsClient from "./fields-client";

export default function SettingsContactsPage() {
  return (
    <FieldsClient 
        apiPath="/api/settings/contact-fields"
        title="Campos Customizáveis de Contato"
        description="Gerencie os campos de dados adicionais para os contatos da plataforma."
    />
  );
}
