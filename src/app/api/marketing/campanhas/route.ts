import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { collection, addDoc, serverTimestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

// Schema para validar a criação de uma nova campanha
const createCampaignSchema = z.object({
  name: z.string().min(1),
  contactIds: z.array(z.string()).min(1),
  channels: z.array(z.string()).min(1),
  emailContent: z.object({
    subject: z.string(),
    body: z.string(),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createCampaignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados da campanha inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    const newCampaignData = {
      ...validation.data,
      status: 'draft', // Sempre salva como rascunho
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
