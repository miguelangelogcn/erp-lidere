import { ContactsClient } from "./contacts-client";
import { ContactImporter } from "@/components/contact-importer";

export default function ContatosPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h1 className="font-headline text-3xl font-bold tracking-tight">Contatos</h1>
         <ContactImporter />
      </div>
      <ContactsClient />
    </div>
  );
}
