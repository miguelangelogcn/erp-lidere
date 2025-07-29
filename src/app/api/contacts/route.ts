import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export async function GET() {
  try {
    const contactsSnapshot = await adminDb.collection('contacts').get();
    const contacts = contactsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
    }));
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Erro ao buscar contatos: ", error);
    return NextResponse.json({ error: 'Falha ao buscar contatos.' }, { status: 500 });
  }
}
