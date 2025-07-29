import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export async function GET() {
  try {
    const duplicatesQuery = adminDb.collection('duplicatesReport').where('status', '==', 'pending');
    const snapshot = await duplicatesQuery.get();
    
    return NextResponse.json({ count: snapshot.size });

  } catch (error) {
    console.error("Erro ao buscar resumo de duplicatas: ", error);
    return NextResponse.json({ error: 'Falha ao buscar resumo de duplicatas.' }, { status: 500 });
  }
}
