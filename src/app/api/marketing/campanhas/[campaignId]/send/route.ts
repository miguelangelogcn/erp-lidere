import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } = params;

  if (!campaignId) {
    return NextResponse.json({ error: 'ID da campanha é obrigatório.' }, { status: 400 });
  }

  try {
    const campaignRef = adminDb.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }
    const campaignData = campaignDoc.data();
    if (!campaignData) {
        return NextResponse.json({ error: 'Dados da campanha não encontrados.' }, { status: 404 });
    }

    const totalContacts = campaignData.contactIds.length;
    
    if (totalContacts === 0) {
        return NextResponse.json({ error: 'Nenhum contato selecionado para esta campanha.' }, { status: 400 });
    }

    await adminDb.collection('dispatches').add({
      campaignId: campaignId,
      status: 'queued',
      createdAt: FieldValue.serverTimestamp(),
      totalContacts: totalContacts,
      processedContacts: 0,
    });

    return NextResponse.json({ message: 'Campanha enfileirada para envio com sucesso!' });

  } catch (error) {
    console.error('Erro ao enfileirar campanha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
