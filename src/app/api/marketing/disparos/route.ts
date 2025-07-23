
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/server";
import { collection, query, where, documentId, getDocs } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

// Schema for request validation
const broadcastSchema = z.object({
  recipients: z.array(z.string()).min(1, "Pelo menos um destinatário é necessário."),
  channel: z.enum(["email", "whatsapp"]),
  subject: z.string().optional(),
  message: z.string().min(1, "A mensagem não pode estar vazia."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = broadcastSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const { recipients, channel, subject, message } = validation.data;

    // Fetch contacts from Firestore
    const contactsRef = collection(adminDb, "contacts");
    const q = query(contactsRef, where(documentId(), "in", recipients));
    const contactsSnapshot = await getDocs(q);
    const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (contacts.length === 0) {
      return NextResponse.json({ error: "Nenhum contato válido encontrado." }, { status: 404 });
    }

    if (channel === "email") {
      // --- Nodemailer Logic for Email ---
      if (!subject) {
        return NextResponse.json({ error: "Assunto é obrigatório para e-mails." }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const emailPromises = contacts.map(contact => {
        if (!contact.email) return Promise.resolve(); // Skip contacts without email
        return transporter.sendMail({
          from: `Lidere University <${process.env.EMAIL_USER}>`,
          to: contact.email,
          subject: subject,
          text: message,
          html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
        });
      });

      await Promise.all(emailPromises);
      return NextResponse.json({ message: "E-mails enviados com sucesso." });

    } else if (channel === "whatsapp") {
      // --- Meta Graph API Logic for WhatsApp ---
      const whatsappPromises = contacts.map(async (contact) => {
        if (!contact.phone) return Promise.resolve(); // Skip contacts without phone
        
        // Basic phone number cleaning - this should be more robust in a real app
        const cleanedPhone = contact.phone.replace(/\D/g, ''); 

        const response = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: cleanedPhone, // Ensure phone number is in international format
                type: "template",
                template: {
                    name: "hello_world", // Replace with your actual template name
                    language: {
                        code: "en_US"
                    }
                }
            })
        });
        if (!response.ok) {
            console.error(`Failed to send WhatsApp to ${cleanedPhone}:`, await response.json());
        }
        return response;
      });

      await Promise.all(whatsappPromises);
      return NextResponse.json({ message: "Mensagens de WhatsApp enviadas com sucesso." });
    }

    // Should not be reached
    return NextResponse.json({ error: "Canal inválido." }, { status: 400 });

  } catch (error: any) {
    console.error("Error sending broadcast:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
