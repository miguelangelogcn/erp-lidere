'use client';

import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { DealCard } from './deal-card';
import { Deal, Pipeline, updateDeal } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PipelinesClientProps {
  initialPipelines: Pipeline[];
}

export function PipelinesClient({ initialPipelines }: PipelinesClientProps) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const { toast } = useToast();
  const router = useRouter();

  const allDeals = pipelines.flatMap(p => p.deals || []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeDeal = allDeals.find(d => d.id === active.id);
      const newStage = over.id as string;

      if (activeDeal && activeDeal.stage !== newStage) {
        const originalPipelines = JSON.parse(JSON.stringify(pipelines));

        // Optimistic UI update
        const updatedPipelines = pipelines.map(p => {
            // Remove deal from old pipeline/stage
            const deals = p.deals?.filter(d => d.id !== active.id) || [];
            
            // Add deal to new pipeline/stage
            if (p.stages.includes(newStage)) {
                const dealToAdd = allDeals.find(d => d.id === active.id);
                if (dealToAdd) {
                   deals.push({ ...dealToAdd, stage: newStage });
                }
            }
            return { ...p, deals };
        });

        // This logic is a bit complex for client-side only, let's simplify
        // Find the deal, update its stage, and move it.
        const dealToMove = allDeals.find(d => d.id === active.id);
        if(!dealToMove) return;

        const newPipelinesState = pipelines.map(p => ({
            ...p,
            deals: p.deals?.filter(d => d.id !== active.id)
        }));
        
        const targetPipeline = newPipelinesState.find(p => p.stages.includes(newStage));
        if(targetPipeline) {
            targetPipeline.deals?.push({...dealToMove, stage: newStage});
        }
        
        setPipelines(newPipelinesState);


        try {
          await updateDeal(active.id as string, { stage: newStage });
          toast({ title: 'Sucesso!', description: 'Negociação movida para o novo estágio.' });
        } catch (error) {
          setPipelines(originalPipelines);
          toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível mover a negociação.' });
        }
      }
    }
  };
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
        {pipelines.map(pipeline => (
          pipeline.stages.map(stage => {
            const dealsInStage = allDeals.filter(deal => deal.pipelineId === pipeline.id && deal.stage === stage);
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
  );
}
