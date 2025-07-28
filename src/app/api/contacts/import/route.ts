import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Lê o conteúdo do arquivo como texto
    const fileContent = await file.text();

    // Usa o Papaparse para analisar o CSV
    const parsedData = Papa.parse(fileContent, {
      header: true, // Trata a primeira linha como cabeçalho
      skipEmptyLines: true,
    });

    const contacts = parsedData.data;

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'O arquivo CSV está vazio ou em formato inválido.' }, { status: 400 });
    }

    // Usa um lote para adicionar todos os contatos de uma vez
    const batch = adminDb.batch();
    const contactsCollection = adminDb.collection('contacts');

    contacts.forEach((contact: any) => {
      // Garante que apenas os campos esperados sejam adicionados
      const newContact = {
        name: contact.nome || '',
        email: contact.email || '',
        phone: contact.telefone || '',
        createdAt: new Date(),
      };
      const docRef = contactsCollection.doc(); // Cria um novo documento com ID aleatório
      batch.set(docRef, newContact);
    });

    await batch.commit();

    return NextResponse.json({ 
      message: 'Importação concluída com sucesso!',
      count: contacts.length 
    });

  } catch (error) {
    console.error("Erro na importação: ", error);
    return NextResponse.json({ error: 'Falha ao importar contatos.' }, { status: 500 });
  }
}
