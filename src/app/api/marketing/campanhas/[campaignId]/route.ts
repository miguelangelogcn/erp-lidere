
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } = params;

  if (!campaignId) {
    return NextResponse.json({ error: 'ID da Campanha é obrigatório.' }, { status: 400 });
  }

  try {
    const campaignRef = adminDb.doc(`campaigns/${campaignId}`);
    
    // Opcional: Verificar se o documento existe antes de deletar
    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }

    await campaignRef.delete();

    return NextResponse.json({ message: 'Campanha excluída com sucesso!' });

  } catch (error: any) {
    console.error("ERRO AO EXCLUIR CAMPANHA:", error);
    return NextResponse.json({ error: 'Falha ao excluir a campanha.', details: error.message }, { status: 500 });
  }
}
