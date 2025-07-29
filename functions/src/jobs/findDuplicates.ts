import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const findDuplicateContacts = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Iniciando a verificação de contatos duplicados...');

    const db = admin.firestore();
    const contactsSnapshot = await db.collection('contacts').get();
    
    // Agrupa contatos por email
    const contactsByEmail = new Map<string, any[]>();
    contactsSnapshot.forEach(doc => {
      const contact = { id: doc.id, ...doc.data() };
      const email = contact.email?.toLowerCase().trim();
      if (email) {
        if (!contactsByEmail.has(email)) {
          contactsByEmail.set(email, []);
        }
        contactsByEmail.get(email)!.push(contact);
      }
    });

    // Filtra apenas os que têm duplicatas
    const duplicatesReportCollection = db.collection('duplicatesReport');
    const existingReportsSnapshot = await duplicatesReportCollection.get();
    const existingEmails = new Set(existingReportsSnapshot.docs.map(doc => doc.id));

    const batch = db.batch();

    for (const [email, contacts] of contactsByEmail.entries()) {
      if (contacts.length > 1) {
        // Se já não existe um relatório para este email, cria um novo
        if (!existingEmails.has(email)) {
          const docRef = duplicatesReportCollection.doc(email);
          const contactIds = contacts.map(c => c.id);
          const primaryContact = contacts.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0]; // O mais recente como primário
          
          batch.set(docRef, {
            email: email,
            duplicateCount: contacts.length,
            contactIds: contactIds,
            primaryContactId: primaryContact.id,
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }
    }

    await batch.commit();
    console.log('Verificação de duplicatas concluída.');
    return null;
  });
