import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import {FieldValue} from "firebase-admin/firestore";

admin.initializeApp();

export const processDispatchQueue = onDocumentCreated("dispatches/{dispatchId}",
  async (event) => {
    const dispatchDoc = event.data;
    if (!dispatchDoc) {
      console.log("Nenhum dado associado ao evento.");
      return;
    }
    const dispatchData = dispatchDoc.data();
    const dispatchId = event.params.dispatchId;

    try {
      // eslint-disable-next-line max-len
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
        // eslint-disable-next-line max-len
        throw new Error(`Campanha ${dispatchData.campaignId} não encontrada.`);
      }

      let contacts: admin.firestore.DocumentData[] = [];
      if (campaignData.segmentType === "tags" && campaignData.targetTags) {
        // eslint-disable-next-line max-len
        const q = admin.firestore().collection("contacts").where("tags", "array-contains-any", campaignData.targetTags);
        const contactsSnapshot = await q.get();
        contacts = contactsSnapshot.docs.map((doc) => doc.data());
      } else if (campaignData.contactIds?.length > 0) {
        // eslint-disable-next-line max-len
        const q = admin.firestore().collection("contacts")
          .where(
            admin.firestore.FieldPath.documentId(),
            "in",
            campaignData.contactIds,
          );
        const contactsSnapshot = await q.get();
        contacts = contactsSnapshot.docs.map((doc) => doc.data());
      }

      if (contacts.length === 0) {
        // eslint-disable-next-line max-len
        throw new Error("Nenhum contato encontrado para esta campanha.");
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

      // eslint-disable-next-line max-len
      console.log(`Iniciando envio para ${contacts.length} contatos.`);
      for (const contact of contacts) {
        const currentDoc = await dispatchDoc.ref.get();
        if (!currentDoc.exists) {
          // eslint-disable-next-line max-len
          console.log(`Disparo ${dispatchId} foi cancelado. Parando.`);
          break;
        }
        if (contact.email && campaignData.emailContent) {
          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
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
      // eslint-disable-next-line max-len
      console.log(`Disparo ${dispatchId} concluído com sucesso.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ?
        error.message : "Ocorreu um erro desconhecido";
      // eslint-disable-next-line max-len
      console.error(`Falha ao processar o disparo ${dispatchId}:`, errorMessage);
      await dispatchDoc.ref.update({
        status: "failed",
        error: errorMessage,
        completedAt: FieldValue.serverTimestamp(),
      });
    }
  },
);
