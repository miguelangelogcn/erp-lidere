// functions/src/index.ts

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import {FieldValue} from "firebase-admin/firestore";
import {defineString} from "firebase-functions/params";

// Define as variáveis de ambiente que a função irá usar
const emailHost = defineString("EMAIL_HOST");
const emailPort = defineString("EMAIL_PORT");
const emailUser = defineString("EMAIL_USER");
const emailPass = defineString("EMAIL_PASS");
const emailFrom = defineString("EMAIL_FROM");

admin.initializeApp();

export const processDispatchQueue = onDocumentCreated(
  {
    document: "dispatches/{dispatchId}",
    // Garante que a função tenha acesso à internet e aos segredos
    secrets: ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS", "EMAIL_FROM"],
  },
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
          .where(admin.firestore.FieldPath.documentId(),
            "in", campaignData.contactIds);
        const contactsSnapshot = await q.get();
        contacts = contactsSnapshot.docs.map((doc) => doc.data());
      }

      if (contacts.length === 0) {
        throw new Error("Nenhum contato encontrado para esta campanha.");
      }

      const transporter = nodemailer.createTransport({
        host: emailHost.value(),
        port: Number(emailPort.value()),
        secure: Number(emailPort.value()) === 465,
        auth: {
          user: emailUser.value(),
          pass: emailPass.value(),
        },
      });

      console.log(`Iniciando envio para ${contacts.length} contatos.`);
      for (const contact of contacts) {
        if (contact.email && campaignData.emailContent) {
          await transporter.sendMail({
            from: emailFrom.value(),
            to: contact.email,
            subject: campaignData.emailContent.subject,
            text: campaignData.emailContent.body,
          });
          // Atualiza o progresso a cada envio
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
  },
);