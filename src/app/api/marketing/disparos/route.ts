import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { Contact } from '@/lib/firebase/firestore';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// Schema para validar os dados recebidos
const dispatchSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'Pelo menos um contato deve ser selecionado.'),
  channel: z.enum(['email', 'whatsapp']),
  subject: z.string().optional(),
  message: z.string().min(1, 'A mensagem não pode estar vazia.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = dispatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { contactIds, channel, subject, message } = validation.data;

    // 1. Buscar os contatos do Firestore
    const contactsRef = adminDb.collection('contacts');
    const querySnapshot = await contactsRef.where('__name__', 'in', contactIds).get();
    
    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Nenhum contato encontrado com os IDs fornecidos.' }, { status: 404 });
    }

    const contacts: Contact[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));

    // 2. Lógica de disparo baseada no canal
    if (channel === 'email') {
      if (!subject) {
        return NextResponse.json({ error: 'O assunto é obrigatório para e-mails.' }, { status: 400 });
      }

      // Configurar o Nodemailer com as variáveis de ambiente
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: Number(process.env.EMAIL_PORT) === 465, // true para porta 465, false para outras
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Enviar e-mails em paralelo
      const emailPromises = contacts.map(contact => {
        if (contact.email) {
          return transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: contact.email,
            subject: subject,
            text: message, // Para e-mails de texto simples
            // html: `<p>${message}</p>`, // Use esta linha para e-mails em HTML
          });
        }
        return Promise.resolve(); // Ignora contatos sem e-mail
      });

      await Promise.all(emailPromises);
      
    } else if (channel === 'whatsapp') {
      // TODO: Implementar a lógica de disparo do WhatsApp
      // A API oficial requer o uso de "Message Templates" pré-aprovados.
      // Você precisará adaptar o código abaixo para o seu template específico.
      
      console.log('Disparando para o WhatsApp (lógica a ser implementada)');
      console.log('Token de acesso:', process.env.WHATSAPP_ACCESS_TOKEN ? 'Configurado' : 'Não configurado');

      // Exemplo de como seria a chamada para a API da Meta
      /*
      const whatsappPromises = contacts.map(contact => {
        if (contact.phone) {
          return fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: contact.phone, // O número precisa estar no formato internacional, ex: 5511999998888
              type: "template",
              template: {
                name: "seu_nome_de_template",
                language: { code: "pt_BR" },
                // Adicione os componentes do seu template aqui
              }
            })
          });
        }
        return Promise.resolve();
      });

      await Promise.all(whatsappPromises);
      */
    }

    return NextResponse.json({ message: 'Disparo realizado com sucesso!' });

  } catch (error: any) {
    console.error('Erro no disparo:', error);
    return NextResponse.json({ error: 'Ocorreu um erro no servidor.', details: error.message }, { status: 500 });
  }
}