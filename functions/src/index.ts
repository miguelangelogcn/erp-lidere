
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// Configure o transportador do Nodemailer com suas credenciais de SMTP
// É ALTAMENTE RECOMENDADO usar variáveis de ambiente para isso
// https://firebase.google.com/docs/functions/config-env
const transporter = nodemailer.createTransport({
    host: functions.config().smtp.host,
    port: functions.config().smtp.port,
    secure: true,
    auth: {
        user: functions.config().smtp.user,
        pass: functions.config().smtp.pass,
    },
});

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


export const processDispatchQueue = functions.firestore
    .document("dispatches/{dispatchId}")
    .onCreate(async (snap, context) => {
        const dispatchId = context.params.dispatchId;
        const dispatch = snap.data();

        if (!dispatch) {
            functions.logger.error("Dados de disparo não encontrados.");
            return;
        }

        const dispatchRef = db.collection("dispatches").doc(dispatchId);

        try {
            // 1. Atualizar status para 'processing'
            await dispatchRef.update({
                status: "processing",
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 2. Obter dados da campanha
            const campaignRef = db.collection("campaigns").doc(dispatch.campaignId);
            const campaignDoc = await campaignRef.get();
            if (!campaignDoc.exists) {
                throw new Error(`Campanha ${dispatch.campaignId} não encontrada.`);
            }
            const campaign = campaignDoc.data() as Campaign;


            // 3. Obter contatos
            let contacts: Contact[] = [];
            const contactsRef = db.collection("contacts");

            if (campaign.segmentType === "tags" && campaign.targetTags?.length) {
                const contactsQuery = await contactsRef.where("tags", "array-contains-any", campaign.targetTags).get();
                contacts = contactsQuery.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Contact);
            } else if (campaign.segmentType === "individual" && campaign.contactIds?.length) {
                const contactsQuery = await contactsRef.where(admin.firestore.FieldPath.documentId(), "in", campaign.contactIds).get();
                contacts = contactsQuery.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Contact);
            }

            if (!contacts.length) {
                throw new Error("Nenhum contato encontrado para esta campanha.");
            }

            // 4. Enviar e-mails e atualizar progresso
            if (campaign.emailContent) {
                for (let i = 0; i < contacts.length; i++) {
                    const contact = contacts[i];
                    await transporter.sendMail({
                        from: `Lidere <${functions.config().smtp.user}>`,
                        to: contact.email,
                        subject: campaign.emailContent.subject,
                        html: campaign.emailContent.body.replace(/{{name}}/g, contact.name),
                    });

                    // Atualizar progresso a cada e-mail enviado
                    await dispatchRef.update({
                        processedContacts: admin.firestore.FieldValue.increment(1),
                    });
                }
            }


            // 5. Finalizar o disparo
            await dispatchRef.update({
                status: "completed",
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`Disparo ${dispatchId} concluído com sucesso!`);

        } catch (error: any) {
            functions.logger.error(`Erro no disparo ${dispatchId}:`, error);
            await dispatchRef.update({
                status: "failed",
                error: error.message,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });


