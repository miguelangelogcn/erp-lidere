import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// Interface para o relatório enriquecido que será retornado
interface EnrichedDuplicateReport {
  id: string;
  type: 'email' | 'phone';
  key: string;
  duplicateCount: number;
  status: string;
  createdAt: any;
  contacts: { id: string; name: string; email: string; }[];
  primaryContactId: string | null;
}

export async function GET() {
  try {
    const duplicatesQuery = adminDb.collection('duplicatesReport').where('status', '==', 'pending');
    const snapshot = await duplicatesQuery.get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }
    
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const enrichedReports: EnrichedDuplicateReport[] = [];

    for (const report of reports) {
      const contactIds = report.contactIds || [];
      if (contactIds.length > 0) {
        
        // Busca os documentos dos contatos em lote
        const contactRefs = contactIds.map((id: string) => adminDb.collection('contacts').doc(id));
        const contactDocs = await adminDb.getAll(...contactRefs);
        
        let primaryContactId = null;
        let mostRecentDate = 0;

        const contactsData = contactDocs
          .map(doc => {
              if (!doc.exists) return null;
              const data = doc.data();
              const createdAt = data?.createdAt?.toMillis() || 0;

              if (createdAt > mostRecentDate) {
                  mostRecentDate = createdAt;
                  primaryContactId = doc.id;
              }

              return {
                  id: doc.id,
                  name: data?.name || 'N/A',
                  email: data?.email || 'N/A'
              };
          })
          .filter(Boolean) as { id: string; name: string; email: string; }[];

        enrichedReports.push({
          id: report.id,
          type: report.type,
          key: report.key,
          duplicateCount: report.duplicateCount,
          status: report.status,
          createdAt: report.createdAt,
          contacts: contactsData,
          primaryContactId: primaryContactId,
        });
      }
    }

    return NextResponse.json(enrichedReports);

  } catch (error) {
    console.error("Erro ao buscar relatório de duplicatas: ", error);
    return NextResponse.json({ error: 'Falha ao buscar relatório de duplicatas.' }, { status: 500 });
  }
}
