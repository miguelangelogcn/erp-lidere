
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

// Função para mesclar dois objetos, priorizando dados existentes no primário
// e tratando o objeto aninhado `customData` e o array `tags`.
function mergeContactData(primary: any, secondary: any): any {
    const merged = { ...primary };

    // Mescla campos no nível raiz
    for (const key in secondary) {
        if (key !== 'customData' && key !== 'tags' && !merged[key] && secondary[key]) {
            merged[key] = secondary[key];
        }
    }

    // Mescla o objeto customData
    if (secondary.customData) {
        if (!merged.customData) {
            merged.customData = {};
        }
        for (const customKey in secondary.customData) {
            if (!merged.customData[customKey] && secondary.customData[customKey]) {
                merged.customData[customKey] = secondary.customData[customKey];
            }
        }
    }
    
    // Mescla o array de tags, evitando duplicatas
    const primaryTags = Array.isArray(primary.tags) ? primary.tags : [];
    const secondaryTags = Array.isArray(secondary.tags) ? secondary.tags : [];
    merged.tags = [...new Set([...primaryTags, ...secondaryTags])];

    return merged;
}


export async function POST(req: Request) {
  try {
    const { reportId } = await req.json(); // Recebe um único reportId (email) para processar

    if (!reportId) {
      return NextResponse.json({ error: 'Nenhum ID de relatório fornecido.' }, { status: 400 });
    }

    const reportRef = adminDb.collection('duplicatesReport').doc(reportId);
    let mergedCount = 0;

    await adminDb.runTransaction(async (transaction) => {
        const reportDoc = await transaction.get(reportRef);
        if (!reportDoc.exists || reportDoc.data()?.status !== 'pending') {
            throw new Error(`Relatório para "${reportId}" não encontrado ou já processado.`);
        }

        const reportData = reportDoc.data()!;
        const { contactIds, primaryContactId } = reportData;
        
        if (!Array.isArray(contactIds) || contactIds.length < 2) {
             throw new Error(`O relatório para "${reportId}" não contém duplicatas válidas.`);
        }

        // Busca todos os documentos de contato de uma vez
        const contactRefs = contactIds.map(id => adminDb.collection('contacts').doc(id));
        const contactDocs = await transaction.getAll(...contactRefs);

        const primaryDoc = contactDocs.find(doc => doc.id === primaryContactId);
        if (!primaryDoc || !primaryDoc.exists) {
            throw new Error(`Contato primário ${primaryContactId} não encontrado.`);
        }

        let mergedData = primaryDoc.data()!;
        const secondaryDocs = contactDocs.filter(doc => doc.id !== primaryContactId);

        // Itera sobre os contatos secundários para mesclar os dados
        for (const secondaryDoc of secondaryDocs) {
            if (secondaryDoc.exists) {
                mergedData = mergeContactData(mergedData, secondaryDoc.data()!);
            }
        }

        // Atualiza o documento principal com os dados mesclados
        transaction.set(primaryDoc.ref, mergedData);

        // Deleta os documentos secundários
        for (const secondaryDoc of secondaryDocs) {
            if (secondaryDoc.exists) {
                transaction.delete(secondaryDoc.ref);
                mergedCount++;
            }
        }

        // Atualiza o status do relatório
        transaction.update(reportRef, {
            status: 'merged',
            mergedAt: FieldValue.serverTimestamp(),
            finalContactId: primaryContactId
        });
    });

    return NextResponse.json({ 
      message: `Mesclagem do grupo "${reportId}" concluída! ${mergedCount} contato(s) foram mesclados no principal.`,
      mergedCount: mergedCount
    });

  } catch (error) {
    console.error("Erro na mesclagem de contatos: ", error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao mesclar contatos.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
