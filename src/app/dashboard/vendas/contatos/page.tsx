import { ContactsClient } from "./contacts-client";

export default function ContatosPage() {
  return (
    <div className="space-y-4">
       <h1 className="font-headline text-3xl font-bold tracking-tight">Contatos</h1>
      <ContactsClient />
    </div>
  );
}
