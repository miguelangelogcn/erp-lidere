// src/app/api/marketing/campanhas/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { collection, addDoc, serverTimestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation, can be expanded with Zod
    if (!body.name || !body.contactIds || !body.channels) {
        return NextResponse.json({ error: 'Dados da campanha incompletos.' }, { status: 400 });
    }

    const newCampaignData = {
      name: body.name,
      contactIds: body.contactIds,
      channels: body.channels,
      emailContent: body.emailContent || null, // Ensure it's null not undefined
      createdAt: serverTimestamp(),
    };

    const campaignsRef = collection(adminDb, 'campaigns');
    const docRef = await addDoc(campaignsRef, newCampaignData);

    return NextResponse.json({ message: 'Campanha salva com sucesso!', campaignId: docRef.id });

  } catch (error: any) {
    console.error("ERRO AO SALVAR CAMPANHA:", error);
    return NextResponse.json({ error: 'Falha ao salvar a campanha.', details: error.message }, { status: 500 });
  }
}
