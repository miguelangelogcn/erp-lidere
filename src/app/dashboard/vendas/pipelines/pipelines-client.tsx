'use client';

import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { DealCard } from './deal-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';
import { DealModal } from './deal-modal';
import { ManagePipelinesModal } from './manage-pipelines-modal';
import { updateDeal } from '@/lib/firebase/firestore-client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { Pipeline, Deal, Contact, Employee } from './firestore-types';


interface PipelinesClientProps {
  initialPipelines: Pipeline[];
  initialDeals: Deal[];
  contacts: Contact[];
  employees: Employee[];
}

export function PipelinesClient({ initialPipelines, initialDeals, contacts, employees }: PipelinesClientProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isPipelinesModalOpen, setIsPipelinesModalOpen] = useState(false);

  const { toast } = useToast();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeDealId = active.id as string;
      const newStage = over.id as string;
      
      const dealToMove = deals.find(d => d.id === activeDealId);
      if (dealToMove && dealToMove.stage !== newStage) {
        
        const originalDeals = [...deals];
        
        // Optimistic UI update
        setDeals(currentDeals => currentDeals.map(d => 
            d.id === activeDealId ? { ...d, stage: newStage } : d
        ));

        try {
          await updateDeal(activeDealId, { stage: newStage });
          toast({ title: 'Sucesso!', description: 'Negociação movida para o novo estágio.' });
        } catch (error) {
          setDeals(originalDeals);
          toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível mover a negociação.' });
        }
      }
    }
  };

  const handleOpenDealModal = (deal: Deal | null) => {
    setSelectedDeal(deal);
    setIsDealModalOpen(true);
  }

  const onPipelinesUpdated = (updatedPipelines: Pipeline[]) => {
    setPipelines(updatedPipelines);
  }

  const onDealUpdated = async () => {
    // This is not optimal, but it's a simple way to refresh deals
    const pipelinesWithDeals = await Promise.all(pipelines.map(async p => {
        const dealsQuery = await fetch(`/api/deals/by-pipeline/${p.id}`).then(res => res.json());
        return {...p, deals: dealsQuery};
    }));
     const allDeals = pipelinesWithDeals.flatMap(p => p.deals || []);
     setDeals(allDeals);
  };
  
  return (
    <>
    <div className='flex justify-between items-center mb-4'>
        <div>{/* Placeholder for filters */}</div>
        <div className='flex gap-2'>
            <Button variant="outline" onClick={() => setIsPipelinesModalOpen(true)}>
                <Settings className='mr-2 h-4 w-4'/>
                Gerenciar Pipelines
            </Button>
            <Button onClick={() => handleOpenDealModal(null)}>
                <PlusCircle className='mr-2 h-4 w-4'/>
                Nova Negociação
            </Button>
        </div>
    </div>
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
        {pipelines.map(pipeline => (
          pipeline.stages.map(stage => {
            const dealsInStage = deals.filter(deal => deal.pipelineId === pipeline.id && deal.stage === stage);
            const totalValue = dealsInStage.reduce((sum, deal) => sum + deal.value, 0);
            return (
              <KanbanColumn key={`${pipeline.id}-${stage}`} id={stage} title={`${stage} (${formatCurrency(totalValue)})`}>
                {dealsInStage.map(deal => (
                  <DealCard key={deal.id} deal={deal} isSelected={false}/>
                ))}
              </KanbanColumn>
            );
          })
        ))}
      </div>
    </DndContext>

    {isDealModalOpen && (
        <DealModal 
            isOpen={isDealModalOpen}
            onClose={() => setIsDealModalOpen(false)}
            deal={selectedDeal}
            pipelines={pipelines}
            contacts={contacts}
            employees={employees}
            onDealUpdated={onDealUpdated}
        />
    )}

    {isPipelinesModalOpen && (
        <ManagePipelinesModal 
            isOpen={isPipelinesModalOpen}
            onClose={() => setIsPipelinesModalOpen(false)}
            onPipelinesUpdated={onPipelinesUpdated}
        />
    )}
    </>
  );
}
