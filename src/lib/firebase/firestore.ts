// Este arquivo agora contém apenas funções que rodam no servidor e usam o Admin SDK.
import { adminDb } from './server'; // Usa a nova configuração de admin
import { Pipeline, Deal } from './firestore-types';

/**
 * Busca todos os pipelines e suas respectivas negociações.
 * Usa o SDK de Admin para acesso privilegiado no servidor.
 */
export async function getPipelinesWithDeals(): Promise<Pipeline[]> {
  const pipelinesCollection = adminDb.collection('pipelines');
  const pipelinesSnapshot = await pipelinesCollection.orderBy('order').get();
  const pipelines = pipelinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pipeline));

  for (const pipeline of pipelines) {
    const dealsCollection = adminDb.collection('deals');
    const dealsQuery = dealsCollection.where('pipelineId', '==', pipeline.id).orderBy('order');
    const dealsSnapshot = await dealsQuery.get();
    pipeline.deals = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
  }

  return pipelines;
}

/**
 * Busca uma única negociação pelo seu ID.
 * Usa o SDK de Admin para acesso privilegiado no servidor.
 */
export async function getDealById(dealId: string): Promise<Deal | null> {
    const dealDoc = await adminDb.collection('deals').doc(dealId).get();
    if (dealDoc.exists) {
        return { id: dealDoc.id, ...dealDoc.data() } as Deal;
    }
    return null;
}

// Outras funções que precisam de acesso de admin podem ser adicionadas aqui.
