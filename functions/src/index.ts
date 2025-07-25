
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";
import * as nodemailer from "nodemailer";

// Inicializa o Firebase Admin SDK.
// É executado uma vez por instância da função.
admin.initializeApp();
const db = admin.firestore();

// Configura o Nodemailer. Use variáveis de ambiente para credenciais.
// firebase functions:config:set smtp.host="smtp.example.com" smtp.port=587 ...
const transporter = nodemailer.createTransport({
  host: functions.config().smtp.host,
  port: functions.config().smtp.port,
  secure: true, // true para 465, false para outras portas
  auth: {
    user: functions.config().smtp.user,
    pass: functions.config().smtp.pass,
  },
});

// Interfaces para tipagem dos dados do Firestore
interface Campaign {
    name: string;
    contactIds?: string[];
    segmentType: "individual" | "tags";
    targetTags?: string[];
    emailContent?: {
        subject: string;
        body: string;
    };
}

interface Contact {
    id: string;
    name: string;
    email: string;
}

// Cloud Function acionada pela criação de um novo documento na coleção 'dispatches'
export const processDispatchQueue = functions.firestore
  .document("dispatches/{dispatchId}")
  .onCreate(async (snap, context) => {
    const {dispatchId} = context.params;
    const dispatch = snap.data();

    if (!dispatch) {
      functions.logger.error(`Disparo ${dispatchId}: Documento de disparo vazio ou não encontrado.`);
      return;
    }

    const dispatchRef = db.collection("dispatches").doc(dispatchId);

    try {
      // 1. Atualiza o status para 'processing'
      functions.logger.info(`Disparo ${dispatchId}: Iniciando processamento.`);
      await dispatchRef.update({
        status: "processing",
        startedAt: FieldValue.serverTimestamp(),
      });

      // 2. Obtém os dados da campanha
      const campaignRef = db.collection("campaigns").doc(dispatch.campaignId);
      const campaignDoc = await campaignRef.get();
      if (!campaignDoc.exists) {
        throw new Error(`Campanha ${dispatch.campaignId} não encontrada.`);
      }
      const campaign = campaignDoc.data() as Campaign;

      // 3. Obtém a lista de contatos
      let contacts: Contact[] = [];
      const contactsRef = db.collection("contacts");

      if (campaign.segmentType === "tags" && campaign.targetTags?.length) {
        const contactsQuery = await contactsRef.where("tags", "array-contains-any", campaign.targetTags).get();
        contacts = contactsQuery.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Contact);
      } else if (campaign.segmentType === "individual" && campaign.contactIds?.length) {
        const contactsQuery = await contactsRef.where(admin.firestore.FieldPath.documentId(), "in", campaign.contactIds).get();
        contacts = contactsQuery.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Contact);
      }

      if (contacts.length === 0) {
        throw new Error("Nenhum contato qualificado encontrado para esta campanha.");
      }

      // 4. Envia e-mails e atualiza o progresso
      if (campaign.emailContent) {
        for (const contact of contacts) {
          // Verifica a cada iteração se o disparo foi cancelado (documento deletado)
          const currentDispatchDoc = await dispatchRef.get();
          if (!currentDispatchDoc.exists) {
            functions.logger.info(`Disparo ${dispatchId}: Cancelamento detectado. Interrompendo.`);
            return; // Encerra a função
          }

          functions.logger.log(`Disparo ${dispatchId}: Enviando e-mail para ${contact.email}`);
          await transporter.sendMail({
            from: `Lidere <${functions.config().smtp.user}>`,
            to: contact.email,
            subject: campaign.emailContent.subject,
            html: campaign.emailContent.body.replace(/{{name}}/g, contact.name),
          });

          // Atualiza o progresso de forma atômica
          await dispatchRef.update({processedContacts: FieldValue.increment(1)});
        }
      }

      // 5. Finaliza o disparo como concluído
      functions.logger.info(`Disparo ${dispatchId}: Processamento concluído.`);
      await dispatchRef.update({
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });
    } catch (error: any) {
      functions.logger.error(`Disparo ${dispatchId}: Falha catastrófica.`, error);
      // Garante que o documento exista antes de tentar atualizá-lo com o erro
      const docToCheck = await dispatchRef.get();
      if (docToCheck.exists) {
        await dispatchRef.update({
          status: "failed",
          error: error.message,
          completedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  });
