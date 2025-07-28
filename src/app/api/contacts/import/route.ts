import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mappingString = formData.get('mapping') as string;

    if (!file || !mappingString) {
      return NextResponse.json({ error: 'Dados incompletos para importação.' }, { status: 400 });
    }

    const mapping = JSON.parse(mappingString);
    const fileContent = await file.text();

    const parsedData = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const contacts = parsedData.data;
    const batch = adminDb.batch();
    const contactsCollection = adminDb.collection('contacts');

    contacts.forEach((row: any) => {
      const newContact: { [key: string]: any } = {
        createdAt: new Date(),
      };

      // Usa o mapeamento para preencher o objeto do contato
      for (const csvHeader in mapping) {
        const systemField = mapping[csvHeader]; // Ex: 'name', 'email', 'phone'
        if (systemField !== 'ignore' && row[csvHeader]) {
          newContact[systemField] = row[csvHeader];
        }
      }
      
      // Só adiciona ao lote se tiver pelo menos um campo mapeado
      if (Object.keys(newContact).length > 1) {
          const docRef = contactsCollection.doc();
          batch.set(docRef, newContact);
      }
    });

    await batch.commit();

    return NextResponse.json({
      message: 'Importação concluída com sucesso!',
      count: contacts.length,
    });

  } catch (error) {
    console.error("Erro na importação: ", error);
    return NextResponse.json({ error: 'Falha ao importar contatos.' }, { status: 500 });
  }
}
