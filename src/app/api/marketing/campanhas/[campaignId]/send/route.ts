
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase-admin/firestore';
import { Contact, Campaign } from '@/lib/firebase/firestore';
import nodemailer from 'nodemailer';

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
    const campaignRef = doc(adminDb, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }

    const campaign = campaignSnap.data() as Campaign;

    if (!campaign.contactIds || campaign.contactIds.length === 0) {
        return NextResponse.json({ error: 'Nenhum contato selecionado para esta campanha.' }, { status: 400 });
    }
    
    // 2. Buscar os contatos associados
    const contactsRef = adminDb.collection('contacts');
    const contactsSnapshot = await contactsRef.where('__name__', 'in', campaign.contactIds).get();
    const contacts: Contact[] = contactsSnapshot.docs.map(doc => doc.data() as Contact);

    // 3. Disparar os e-mails
    let dispatchSuccessful = true;
    if (campaign.channels.includes('email')) {
        const emailContent = campaign.emailContent;
        if (!emailContent || !emailContent.subject || !emailContent.body) {
            return NextResponse.json({ error: 'Conteúdo do e-mail (assunto e corpo) não definido na campanha.' }, { status: 400 });
        }
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: Number(process.env.EMAIL_PORT) === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const emailPromises = contacts
            .filter(c => c.email)
            .map(contact => {
                return transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: contact.email,
                    subject: campaign.emailContent!.subject,
                    text: campaign.emailContent!.body,
                });
            });
        
        try {
            await Promise.all(emailPromises);
        } catch(emailError) {
            console.error("ERRO AO ENVIAR E-MAILS:", emailError);
            dispatchSuccessful = false;
        }
    }


    // 4. Registrar o evento de disparo no histórico
    const dispatchesRef = collection(adminDb, 'dispatches');
    await addDoc(dispatchesRef, {
      campaignId: campaignId,
      dispatchDate: serverTimestamp(), // Usa a data e hora do servidor
      status: dispatchSuccessful ? 'success' : 'failed',
    });

    if (!dispatchSuccessful) {
        throw new Error("Falha no envio de um ou mais e-mails.");
    }

    return NextResponse.json({ message: 'Campanha disparada e registrada com sucesso!' });

  } catch (error: any) {
    console.error("ERRO AO DISPARAR CAMPANHA:", error);
    // Tenta registrar a falha no histórico
    try {
      const dispatchesRef = collection(adminDb, 'dispatches');
      await addDoc(dispatchesRef, {
        campaignId: campaignId,
        dispatchDate: serverTimestamp(),
        status: 'failed',
        error: error.message,
      });
    } catch (logError) {
      console.error("ERRO AO REGISTRAR FALHA NO DISPARO:", logError);
    }
    return NextResponse.json({ error: 'Falha ao disparar campanha.', details: error.message }, { status: 500 });
  }
}
