import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Garante que o app do Firebase só seja inicializado uma vez.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Analisa os contatos no Firestore em busca de duplicatas por e-mail e telefone
 * e cria um relatório na coleção 'duplicatesReport'.
 */
export async function analyzeAndReportDuplicates() {
  logger.info("Iniciando a verificação aprimorada de contatos duplicados (email e telefone)...");

  const db = admin.firestore();
  const contactsSnapshot = await db.collection("contacts").get();

  const contactsByEmail = new Map<string, any[]>();
  const contactsByPhone = new Map<string, any[]>();

  // 1. Mapeia todos os contatos por email e por telefone
  contactsSnapshot.forEach(doc => {
    const contact = { id: doc.id, ...doc.data() } as { [key: string]: any };
    
    const email = contact.email?.toLowerCase().trim();
    if (email) {
      if (!contactsByEmail.has(email)) contactsByEmail.set(email, []);
      contactsByEmail.get(email)!.push(contact);
    }

    const phone = contact.phone?.replace(/\D/g, ''); // Limpa o telefone para comparar apenas números
    if (phone) {
      if (!contactsByPhone.has(phone)) contactsByPhone.set(phone, []);
      contactsByPhone.get(phone)!.push(contact);
    }
  });

  // 2. Agrupa todos os IDs de contatos duplicados em conjuntos
  const duplicateSets = new Map<string, Set<string>>();

  const addDuplicatesToSet = (key: string, contacts: any[]) => {
    if (contacts.length > 1) {
      if (!duplicateSets.has(key)) duplicateSets.set(key, new Set());
      contacts.forEach(c => duplicateSets.get(key)!.add(c.id));
    }
  };

  contactsByEmail.forEach((contacts, email) => addDuplicatesToSet(`email-${email}`, contacts));
  contactsByPhone.forEach((contacts, phone) => addDuplicatesToSet(`phone-${phone}`, contacts));

  // 3. Prepara para salvar os relatórios no Firestore
  const duplicatesReportCollection = db.collection("duplicatesReport");
  const batch = db.batch();

  for (const [key, idSet] of duplicateSets.entries()) {
    const contactIds = Array.from(idSet);
    if (contactIds.length > 1) {
      const docRef = duplicatesReportCollection.doc(key.replace(/[@.]/g, '_')); // Cria um ID de documento válido
      
      batch.set(docRef, {
        type: key.startsWith('email') ? 'email' : 'phone',
        key: key.startsWith('email') ? key.substring(6) : key.substring(6),
        duplicateCount: contactIds.length,
        contactIds: contactIds,
        status: "pending",
        createdAt: new Date(),
      }, { merge: true });
    }
  }

  await batch.commit();
  logger.info("Verificação aprimorada de duplicatas concluída.");
}
