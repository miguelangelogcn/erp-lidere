
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { Campaign } from '@/lib/firebase/firestore';

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } = params;

  if (!campaignId) {
    return NextResponse.json({ error: 'ID da Campanha é obrigatório.' }, { status: 400 });
  }

  try {
    // 1. Buscar os dados da campanha
    const campaignRef = adminDb.doc(`campaigns/${campaignId}`);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }

    const campaign = campaignSnap.data() as Campaign;
    
    // 2. Buscar os contatos associados
    let contactsQuery;
    const contactsRef = adminDb.collection('contacts');

    if (campaign.segmentType === 'tags' && campaign.targetTags && campaign.targetTags.length > 0) {
        contactsQuery = await contactsRef.where('tags', 'array-contains-any', campaign.targetTags).get();
    } else if (campaign.segmentType === 'individual' && campaign.contactIds && campaign.contactIds.length > 0) {
        contactsQuery = await contactsRef.where('__name__', 'in', campaign.contactIds).get();
    } else {
        return NextResponse.json({ error: 'Nenhum contato ou critério de tag selecionado para esta campanha.' }, { status: 400 });
    }
    
    const totalContacts = contactsQuery.size;

    if (totalContacts === 0) {
       return NextResponse.json({ error: 'Nenhum contato encontrado para os critérios da campanha.' }, { status: 400 });
    }

    // 3. Criar (enfileirar) o registro de disparo
    const dispatchesRef = adminDb.collection('dispatches');
    await dispatchesRef.add({
      campaignId: campaignId,
      campaignName: campaign.name, // Adicionar o nome da campanha
      status: 'queued',
      totalContacts: totalContacts,
      processedContacts: 0,
      createdAt: FieldValue.serverTimestamp(),
      startedAt: null,
      completedAt: null,
      error: null,
    });

    return NextResponse.json({ message: 'Campanha enfileirada para disparo com sucesso!' });

  } catch (error: any) {
    console.error("ERRO AO ENFILEIRAR CAMPANHA:", error);
    return NextResponse.json({ error: 'Falha ao enfileirar campanha.', details: error.message }, { status: 500 });
  }
}
