
import { NextResponse } from 'next/server';
import { adminDb, getDoc, doc, collection, addDoc, serverTimestamp } from '@/lib/firebase/server';
import { Contact, Campaign } from '@/lib/firebase/firestore';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const dispatchSchema = z.object({
  campaignId: z.string().min(1, 'O ID da campanha é obrigatório.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = dispatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { campaignId } = validation.data;

    // 1. Buscar a campanha no Firestore
    const campaignRef = doc(adminDb, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignRef);

    if (!campaignDoc.exists()) {
        return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }
    const campaign = campaignDoc.data() as Campaign;
    
    // 2. Validar se a campanha pode ser enviada
    if (!campaign.contactIds || campaign.contactIds.length === 0) {
        return NextResponse.json({ error: 'Nenhum contato selecionado para esta campanha.' }, { status: 400 });
    }

    // 3. Buscar os contatos do Firestore
    const contactsRef = adminDb.collection('contacts');
    const querySnapshot = await contactsRef.where('__name__', 'in', campaign.contactIds).get();

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Nenhum contato encontrado com os IDs fornecidos.' }, { status: 404 });
    }
    const contacts: Contact[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));

    let dispatchSuccessful = true;

    // 4. Lógica de disparo baseada nos canais da campanha
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
        .filter(contact => contact.email) // Garante que apenas contatos com email sejam processados
        .map(contact => {
          return transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: contact.email,
            subject: emailContent.subject,
            text: emailContent.body,
          });
        });
        
      try {
        await Promise.all(emailPromises);
      } catch (emailError) {
          console.error("ERRO AO ENVIAR E-MAILS:", emailError);
          dispatchSuccessful = false;
      }
    }
    
    if (campaign.channels.includes('whatsapp')) {
        // Lógica do WhatsApp no futuro
    }

    // 5. Registrar o disparo (Dispatch)
    const dispatchRef = collection(adminDb, 'dispatches');
    await addDoc(dispatchRef, {
        campaignId: campaignId,
        dispatchDate: serverTimestamp(),
        status: dispatchSuccessful ? 'success' : 'failed'
    });


    return NextResponse.json({ message: `Campanha disparada com sucesso para ${contacts.length} contato(s)!` });

  } catch (error: any) {
    console.error('ERRO NO DISPARO DE CAMPANHA:', error);
    return NextResponse.json({ error: 'Falha ao disparar a campanha.', details: error.message }, { status: 500 });
  }
}
