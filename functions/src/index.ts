import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import {FieldValue} from "firebase-admin/firestore";

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
      // As variáveis de ambiente são lidas aqui, somente no ambiente
      // da nuvem, evitando o erro da análise local.
      const env = process.env;
      const port = parseInt(env.EMAIL_PORT || "465", 10);

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
        contacts = (await q.get()).docs.map((doc) => doc.data());
      } else if (campaignData.contactIds?.length > 0) {
        const q = admin.firestore().collection("contacts")
          .where(
            admin.firestore.FieldPath.documentId(),
            "in",
            campaignData.contactIds
          );
        contacts = (await q.get()).docs.map((doc) => doc.data());
      }

      if (contacts.length === 0) {
        throw new Error("Nenhum contato encontrado para esta campanha.");
      }

      const transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: port,
        secure: port === 465,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASS,
        },
      });

      console.log(`Iniciando envio para ${contacts.length} contatos.`);
      for (const contact of contacts) {
        if (contact.email && campaignData.emailContent) {
          await transporter.sendMail({
            from: env.EMAIL_FROM,
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
      const msg = error instanceof Error ?
        error.message : "Ocorreu um erro desconhecido";
      console.error(`Falha ao processar o disparo ${dispatchId}:`, msg);
      await dispatchDoc.ref.update({
        status: "failed",
        error: msg,
        completedAt: FieldValue.serverTimestamp(),
      });
    }
  },
);