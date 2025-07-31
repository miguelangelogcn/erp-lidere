'use client';

import { useState, useEffect } from 'react';
import { getPipelinesWithDeals } from '@/lib/firebase/firestore';
import { PipelinesClient } from './pipelines-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Pipeline } from '@/lib/firebase/firestore-types';

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPipelinesWithDeals();
        setPipelines(data);
      } catch (error) {
        console.error("Failed to fetch pipelines:", error);
        // Optionally, set an error state to show a message to the user
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Funil de Vendas</h2>
          <p className="text-muted-foreground">
            Gerencie suas negociações arrastando e soltando pelos estágios.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
             {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80 h-full p-2 flex flex-col space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
             ))}
        </div>
      ) : pipelines ? (
          <PipelinesClient initialPipelines={pipelines} />
      ) : (
        <p>Não foi possível carregar os pipelines.</p>
      )}
    </div>
  );
}
