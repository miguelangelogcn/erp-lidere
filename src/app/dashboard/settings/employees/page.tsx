
import FieldsClient from "../contacts/fields-client";

export default function SettingsEmployeesPage() {
  return (
    <FieldsClient 
        apiPath="/api/settings/employee-fields"
        title="Campos Customizáveis de Funcionário"
        description="Gerencie os campos de dados adicionais para os funcionários da plataforma."
    />
  );
}
