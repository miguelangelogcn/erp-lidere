
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
    const dispatchRef = adminDb.doc(`dispatches/${dispatchId}`);
    
    // Opcional: Verificar se o documento existe antes de deletar
    const dispatchSnap = await dispatchRef.get();
    if (!dispatchSnap.exists) {
      return NextResponse.json({ error: 'Disparo não encontrado.' }, { status: 404 });
    }

    await dispatchRef.delete();

    return NextResponse.json({ message: 'Disparo cancelado com sucesso!' });

  } catch (error: any) {
    console.error("ERRO AO CANCELAR DISPARO:", error);
    return NextResponse.json({ error: 'Falha ao cancelar o disparo.', details: error.message }, { status: 500 });
  }
}
