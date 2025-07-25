// src/app/api/marketing/dispatches/[dispatchId]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { dispatchId: string } }
) {
  const { dispatchId } = params;

  if (!dispatchId) {
    return NextResponse.json({ error: 'ID do Disparo é obrigatório.' }, { status: 400 });
  }

  try {
    await adminDb.collection('dispatches').doc(dispatchId).delete();
    console.log(`Disparo ${dispatchId} cancelado e excluído com sucesso.`);
    return NextResponse.json({ message: 'Disparo cancelado com sucesso.' });
  } catch (error: any) {
    console.error(`Falha ao excluir o disparo ${dispatchId}:`, error);
    return NextResponse.json({ error: 'Falha ao excluir o disparo.', details: error.message }, { status: 500 });
  }
}