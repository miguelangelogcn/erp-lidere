import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

// Função auxiliar para mesclar um único grupo, que será chamada para cada item
async function mergeGroup(reportId: string) {
  const reportRef = adminDb.collection('duplicatesReport').doc(reportId);

  await adminDb.runTransaction(async (transaction) => {
    const reportDoc = await transaction.get(reportRef);
    if (!reportDoc.exists) throw new Error(`Relatório ${reportId} não encontrado.`);

    const reportData = reportDoc.data();
    const contactIds = reportData?.contactIds;
    if (!contactIds || contactIds.length < 2) {
      transaction.update(reportRef, { status: 'archived', error: 'No contacts to merge' });
      return;
    }
    
    const contactRefs = contactIds.map((id: string) => adminDb.collection('contacts').doc(id));
    const contactDocs = await transaction.getAll(...contactRefs);

    const validContacts = contactDocs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() }));

    if (validContacts.length < 2) {
        transaction.update(reportRef, { status: 'archived', error: 'Not enough valid contacts to merge' });
        return;
    }

    validContacts.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));

    const primaryContact = validContacts[0];
    const secondaryContacts = validContacts.slice(1);
    
    const mergedData = { ...primaryContact };
    if (!mergedData.customData) mergedData.customData = {};

    secondaryContacts.forEach(contact => {
      Object.keys(contact).forEach(key => {
        if (!mergedData[key] && contact[key]) mergedData[key] = contact[key];
      });
      if (contact.customData) {
        Object.keys(contact.customData).forEach(customKey => {
          if (!mergedData.customData[customKey] && contact.customData[customKey]) {
            mergedData.customData[customKey] = contact.customData[customKey];
          }
        });
      }
    });
    
    mergedData.updatedAt = FieldValue.serverTimestamp();

    const primaryRef = adminDb.collection('contacts').doc(primaryContact.id);
    transaction.set(primaryRef, mergedData, { merge: true });

    secondaryContacts.forEach(contact => {
      transaction.delete(adminDb.collection('contacts').doc(contact.id));
    });

    transaction.update(reportRef, { status: 'merged' });
  });
}

export async function POST(req: Request) {
  try {
    const { reportIds } = await req.json();

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum ID de relatório fornecido.' }, { status: 400 });
    }

    // Executa a mesclagem para cada relatório em paralelo
    await Promise.all(reportIds.map(id => mergeGroup(id)));

    return NextResponse.json({ 
        message: `${reportIds.length} grupos de duplicatas foram mesclados com sucesso!` 
    });

  } catch (error: any) {
    console.error("Erro na mesclagem em massa: ", error);
    return NextResponse.json({ error: error.message || 'Falha ao mesclar contatos.' }, { status: 500 });
  }
}
