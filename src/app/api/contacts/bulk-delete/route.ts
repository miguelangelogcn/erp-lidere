import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export async function POST(req: Request) {
  try {
    const { contactIds } = await req.json();

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum ID de contato fornecido.' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const contactsCollection = adminDb.collection('contacts');

    contactIds.forEach((id: string) => {
      const docRef = contactsCollection.doc(id);
      batch.delete(docRef);
    });

    await batch.commit();

    return NextResponse.json({ 
      message: 'Contatos excluídos com sucesso!',
      count: contactIds.length 
    });

  } catch (error) {
    console.error("Erro na exclusão em massa: ", error);
    return NextResponse.json({ error: 'Falha ao excluir contatos.' }, { status: 500 });
  }
}
