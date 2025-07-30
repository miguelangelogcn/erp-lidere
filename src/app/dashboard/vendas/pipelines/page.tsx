import { getPipelinesWithDeals } from '@/lib/firebase/firestore';
import { PipelinesClient } from './pipelines-client';
import { getContacts, getEmployees, getPipelines } from '@/lib/firebase/firestore-client';

export default async function PipelinesPage() {
  const [pipelines, deals, contacts, employees] = await Promise.all([
    getPipelines(),
    getPipelinesWithDeals(), // This can be simplified if deals are directly associated
    getContacts(),
    getEmployees()
  ]);

  const allDeals = deals.flatMap(p => p.deals || []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
         <h1 className="font-headline text-3xl font-bold tracking-tight mb-4">Pipelines de Vendas</h1>
      </div>
      <PipelinesClient 
        initialPipelines={pipelines} 
        initialDeals={allDeals} 
        contacts={contacts} 
        employees={employees} 
      />
    </div>
  );
}
