import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { reportId } = await req.json(); // Esperamos o ID do relatório a ser mesclado

    if (!reportId) {
      return NextResponse.json({ error: 'ID do relatório de duplicatas não fornecido.' }, { status: 400 });
    }

    const reportRef = adminDb.collection('duplicatesReport').doc(reportId);

    // Usamos uma transação para garantir que todas as operações ocorram ou nenhuma ocorra
    await adminDb.runTransaction(async (transaction) => {
      const reportDoc = await transaction.get(reportRef);
      if (!reportDoc.exists) {
        throw new Error('Relatório de duplicatas não encontrado.');
      }

      const reportData = reportDoc.data();
      const contactIds = reportData?.contactIds;

      if (!contactIds || contactIds.length < 2) {
        throw new Error('O relatório não contém contatos para mesclar.');
      }
      
      // Busca todos os documentos de contato dentro da transação
      const contactRefs = contactIds.map((id: string) => adminDb.collection('contacts').doc(id));
      const contactDocs = await transaction.getAll(...contactRefs);

      // Encontra o contato mais recente para ser o principal
      const contacts = contactDocs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));

      const primaryContact = contacts[0];
      const secondaryContacts = contacts.slice(1);
      
      const mergedData = { ...primaryContact };
      if (!mergedData.customData) {
        mergedData.customData = {};
      }

      // Lógica de enriquecimento: preenche os campos vazios do contato principal
      secondaryContacts.forEach(contact => {
        Object.keys(contact).forEach(key => {
          // Se o campo está vazio no principal e preenchido no secundário, copia o dado
          if (!mergedData[key] && contact[key]) {
            mergedData[key] = contact[key];
          }
        });
        
        // Lógica de enriquecimento para campos customizáveis
        if (contact.customData) {
            Object.keys(contact.customData).forEach(customKey => {
                if(!mergedData.customData[customKey] && contact.customData[customKey]) {
                    mergedData.customData[customKey] = contact.customData[customKey];
                }
            });
        }
      });
      
      mergedData.updatedAt = FieldValue.serverTimestamp();

      // 1. Atualiza o documento principal com os dados mesclados
      const primaryRef = adminDb.collection('contacts').doc(primaryContact.id);
      transaction.set(primaryRef, mergedData, { merge: true });

      // 2. Deleta os contatos secundários
      secondaryContacts.forEach(contact => {
        const secondaryRef = adminDb.collection('contacts').doc(contact.id);
        transaction.delete(secondaryRef);
      });

      // 3. Atualiza o status do relatório para "merged"
      transaction.update(reportRef, { status: 'merged' });
    });

    return NextResponse.json({ message: `Grupo ${reportId} mesclado com sucesso!` });

  } catch (error: any) {
    console.error("Erro na mesclagem: ", error);
    return NextResponse.json({ error: error.message || 'Falha ao mesclar contatos.' }, { status: 500 });
  }
}
