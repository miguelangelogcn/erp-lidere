
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue, query, where, getDocs, collection } from 'firebase-admin/firestore';
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
    const campaignRef = adminDb.doc(`campaigns/${campaignId}`);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }

    const campaign = campaignSnap.data() as Campaign & { whatsappContent?: { templateName: string } };
    
    // 2. Buscar os contatos associados
    let contacts: Contact[] = [];
    const contactsRef = adminDb.collection('contacts');

    if (campaign.segmentType === 'tags' && campaign.targetTags && campaign.targetTags.length > 0) {
        // Busca por tags
        const contactsQuery = await contactsRef.where('tags', 'array-contains-any', campaign.targetTags).get();
        contacts = contactsQuery.docs.map(doc => doc.data() as Contact);
    } else {
        // Busca por IDs individuais (legado ou individual)
        if (!campaign.contactIds || campaign.contactIds.length === 0) {
            return NextResponse.json({ error: 'Nenhum contato selecionado para esta campanha.' }, { status: 400 });
        }
        const contactsQuery = await contactsRef.where('__name__', 'in', campaign.contactIds).get();
        contacts = contactsQuery.docs.map(doc => doc.data() as Contact);
    }
    
    if (contacts.length === 0) {
       return NextResponse.json({ error: 'Nenhum contato encontrado para os critérios da campanha.' }, { status: 400 });
    }

    // 3. Disparar as mensagens
    let successfulDispatches = 0;
    const totalChannels = campaign.channels.length;
    let errors: string[] = [];

    // Disparo de E-mails
    if (campaign.channels.includes('email')) {
        const emailContent = campaign.emailContent;
        if (!emailContent || !emailContent.subject || !emailContent.body) {
            errors.push('Conteúdo do e-mail (assunto e corpo) não definido na campanha.');
        } else {
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
                .map(contact => transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: contact.email,
                    subject: campaign.emailContent!.subject,
                    text: campaign.emailContent!.body,
                }));
            
            try {
                await Promise.all(emailPromises);
                successfulDispatches++;
            } catch(emailError: any) {
                console.error("ERRO AO ENVIAR E-MAILS:", emailError);
                errors.push(`Falha no envio de e-mails: ${emailError.message}`);
            }
        }
    }
    
    // Disparo de WhatsApp
    if (campaign.channels.includes('whatsapp')) {
        const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;
        const templateName = campaign.whatsappContent?.templateName;

        if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            errors.push("Credenciais do WhatsApp não configuradas no servidor.");
        } else if (!templateName) {
            errors.push("Modelo de mensagem do WhatsApp não definido na campanha.");
        } else {
            const whatsappPromises = contacts
                .filter(c => c.phone) // Garante que o contato tem um telefone
                .map(contact => {
                    const payload = {
                        messaging_product: "whatsapp",
                        to: contact.phone,
                        type: "template",
                        template: {
                            name: templateName,
                            language: {
                                code: "pt_BR" // Ou o código de idioma do seu modelo
                            }
                        }
                    };
                    console.log(`[WhatsApp Debug] Enviando para: ${contact.phone}`);
                    console.log("[WhatsApp Debug] Payload:", JSON.stringify(payload, null, 2));

                    return fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                });

            try {
                const results = await Promise.all(whatsappPromises);
                for (const [index, res] of results.entries()) {
                    const targetPhone = contacts.filter(c => c.phone)[index].phone;
                    const responseBody = await res.json(); // Pega o corpo da resposta
                    
                    console.log(`[WhatsApp Debug] Resposta da Meta para ${targetPhone}:`);
                    console.log(`  - Status: ${res.status} ${res.statusText}`);
                    console.log("  - Corpo:", JSON.stringify(responseBody, null, 2));

                    if (!res.ok) {
                        // O logging de erro já está sendo feito com mais detalhes acima.
                        errors.push(`Falha no envio para ${targetPhone}.`);
                    }
                }
                
                // Considera sucesso se nenhuma exceção for lançada, a análise detalhada fica no log.
                successfulDispatches++;
                
            } catch(whatsappError: any) {
                 console.error("ERRO GERAL AO ENVIAR WHATSAPP:", whatsappError);
                 errors.push(`Falha no envio de WhatsApp: ${whatsappError.message}`);
            }
        }
    }


    // 4. Registrar o evento de disparo no histórico
    const status = successfulDispatches > 0 ? 'success' : 'failed';
    const dispatchesRef = adminDb.collection('dispatches');
    await dispatchesRef.add({
      campaignId: campaignId,
      dispatchDate: FieldValue.serverTimestamp(),
      status: status,
      details: errors.length > 0 ? errors.join('; ') : 'Envio concluído.'
    });

    if (status === 'failed') {
        throw new Error(errors.join('; '));
    }

    return NextResponse.json({ message: 'Campanha disparada e registrada com sucesso!' });

  } catch (error: any) {
    console.error("ERRO AO DISPARAR CAMPANHA:", error);
    // Tenta registrar a falha no histórico
    try {
      const dispatchesRef = adminDb.collection('dispatches');
      await dispatchesRef.add({
        campaignId: campaignId,
        dispatchDate: FieldValue.serverTimestamp(),
        status: 'failed',
        error: error.message,
      });
    } catch (logError) {
      console.error("ERRO AO REGISTRAR FALHA NO DISPARO:", logError);
    }
    return NextResponse.json({ error: 'Falha ao disparar campanha.', details: error.message }, { status: 500 });
  }
}
