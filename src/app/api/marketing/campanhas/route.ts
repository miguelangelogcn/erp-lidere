
import { NextResponse } from 'next/server';
    import { adminDb } from '@/lib/firebase/server';
    import { FieldValue } from 'firebase-admin/firestore';
    
    export async function POST(request: Request) {
      try {
        const body = await request.json();
    
        // Construção segura do payload
        const newCampaignData: any = {
          name: body.name,
          segmentType: body.segmentType,
          contactIds: body.contactIds || [],
          targetTags: body.targetTags || [],
          channels: body.channels || [],
          createdAt: FieldValue.serverTimestamp(),
        };

        if (body.channels && body.channels.includes('email') && body.emailContent) {
          newCampaignData.emailContent = body.emailContent;
        }

        if (body.channels && body.channels.includes('whatsapp') && body.whatsappContent) {
          newCampaignData.whatsappContent = body.whatsappContent;
        }
    
        // Log detalhado ANTES da chamada ao Firestore
        console.log("===================================");
        console.log("TENTANDO SALVAR OS SEGUINTES DADOS NO FIRESTORE:");
        console.log(JSON.stringify(newCampaignData, null, 2));
        console.log("===================================");
    
        const campaignsRef = adminDb.collection('campaigns');
        const docRef = await campaignsRef.add(newCampaignData);
    
        console.log(`✔️ Campanha salva com sucesso com o ID: ${docRef.id}`);
    
        return NextResponse.json({ message: 'Campanha criada com sucesso!', campaignId: docRef.id });
    
      } catch (error: any) {
        // Log de erro aprimorado
        console.error("===================================");
        console.error("❌ ERRO AO SALVAR CAMPANHA NO FIRESTORE:");
        console.error("Código do Erro:", error.code);
        console.error("Mensagem do Erro:", error.message);
        console.error("Objeto de Erro Completo:", error);
        console.error("===================================");
        
        return NextResponse.json({ error: 'Falha ao salvar a campanha no banco de dados.', details: error.message }, { status: 500 });
      }
    }
    
