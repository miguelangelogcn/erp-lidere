import { getPipelinesWithDeals } from '@/lib/firebase/firestore';
import { PipelinesClient } from './pipelines-client';

export default async function PipelinesPage() {
  // Esta função busca os pipelines e já inclui as negociações (deals) dentro de cada um.
  const pipelines = await getPipelinesWithDeals();

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Funil de Vendas</h2>
          <p className="text-muted-foreground">
            Gerencie suas negociações arrastando e soltando pelos estágios.
          </p>
        </div>
      </div>
      <PipelinesClient initialPipelines={pipelines} />
    </div>
  );
}