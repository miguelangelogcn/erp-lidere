import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import {FieldValue} from "firebase-admin/firestore";

// --- Validação robusta das variáveis de ambiente ---
const
  env = process.env;

if (!env.EMAIL_HOST || !env.EMAIL_PORT || !env.EMAIL_USER || !env.EMAIL_PASS || !env.EMAIL_FROM) {
  throw new Error(
    "Uma ou mais variáveis de ambiente de e-mail (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM) não estão definidas no arquivo .env.lidere-8dq24"
  );
}

const EMAIL_HOST = env.EMAIL_HOST;
const EMAIL_PORT = parseInt(env.EMAIL_PORT, 10);
const EMAIL_USER = env.EMAIL_USER;
const EMAIL_PASS = env.EMAIL_PASS;
const EMAIL_FROM = env.EMAIL_FROM;

if (isNaN(EMAIL_PORT)) {
    throw new Error("A variável de ambiente EMAIL_PORT não é um número válido.");
}
// --- Fim da validação ---

admin.initializeApp();

export const processDispatchQueue = onDocumentCreated(
  "dispatches/{dispatchId}",
  async (event) => {
    const dispatchDoc = event.data;
    if (!dispatchDoc) {
      console.log("Nenhum dado associado ao evento.");
      return;
    }
    const dispatchData = dispatchDoc.data();
    const dispatchId = event.params.dispatchId;

    try {
      console.log(`Processando disparo: ${dispatchId}`);
      await dispatchDoc.ref.update({
        status: "processing",
        startedAt: FieldValue.serverTimestamp(),
      });

      const campaignRef = admin.firestore()
        .doc(`campaigns/${dispatchData.campaignId}`);
      const campaignSnap = await campaignRef.get();
      const campaignData = campaignSnap.data();

      if (!campaignData) {
        throw new Error(`Campanha ${dispatchData.campaignId} não encontrada.`);
      }

      let contacts: admin.firestore.DocumentData[] = [];
      if (campaignData.segmentType === "tags" && campaignData.targetTags) {
        const q = admin.firestore().collection("contacts")
          .where("tags", "array-contains-any", campaignData.targetTags);
        const contactsSnapshot = await q.get();
        contacts = contactsSnapshot.docs.map((doc) => doc.data());
      } else if (campaignData.contactIds?.length > 0) {
        const q = admin.firestore().collection("contacts")
          .where(
            admin.firestore.FieldPath.documentId(),
            "in",
            campaignData.contactIds
          );
        const contactsSnapshot = await q.get();
        contacts = contactsSnapshot.docs.map((doc) => doc.data());
      }

      if (contacts.length === 0) {
        throw new Error("Nenhum contato encontrado para esta campanha.");
      }

      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT === 465,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

      console.log(`Iniciando envio para ${contacts.length} contatos.`);
      for (const contact of contacts) {
        if (contact.email && campaignData.emailContent) {
          await transporter.sendMail({
            from: EMAIL_FROM,
            to: contact.email,
            subject: campaignData.emailContent.subject,
            text: campaignData.emailContent.body,
          });
          await dispatchDoc.ref.update({
            processedContacts: FieldValue.increment(1),
          });
        }
      }

      await dispatchDoc.ref.update({
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Disparo ${dispatchId} concluído com sucesso.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ?
        error.message : "Ocorreu um erro desconhecido";
      console.error(`Falha ao processar o disparo ${dispatchId}:`, errorMessage);
      await dispatchDoc.ref.update({
        status: "failed",
        error: errorMessage,
        completedAt: FieldValue.serverTimestamp(),
      });
    }
  }
);
