"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Pipeline,
  Deal,
  getPipelines,
  getDealsByPipeline,
  updateDeal,
  Contact,
  Employee,
  getContacts,
  getEmployees,
} from "@/lib/firebase/firestore";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import { ManagePipelinesModal } from "./manage-pipelines-modal";
import { DealModal } from "./deal-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { DealComments } from "./deal-comments";

export function PipelinesClient() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isPipelinesModalOpen, setIsPipelinesModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealForModal, setDealForModal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const refreshPipelines = async () => {
    if (!user) return;
    const pipelinesData = await getPipelines();
    setPipelines(pipelinesData);
    if (pipelinesData.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelinesData[0].id);
    }
  };

  const refreshDeals = async () => {
    if (!user || !selectedPipelineId) {
      setDeals([]);
      return;
    }
    setLoading(true);
    try {
      const dealsData = await getDealsByPipeline(selectedPipelineId);
      setDeals(dealsData);
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as negociações." });
    } finally {
      setLoading(false);
    }
  };
  
  const loadInitialData = async () => {
    if(!user) return;
    try {
        setLoading(true);
        await refreshPipelines();
        const [contactsData, employeesData] = await Promise.all([getContacts(), getEmployees()]);
        setContacts(contactsData);
        setEmployees(employeesData);
    } catch(e) {
        toast({ variant: "destructive", title: "Falha ao carregar dados iniciais." });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [user]);

  useEffect(() => {
    refreshDeals();
  }, [selectedPipelineId, user]);

  const selectedPipeline = useMemo(() => {
    return pipelines.find((p) => p.id === selectedPipelineId);
  }, [pipelines, selectedPipelineId]);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const dealId = active.id as string;
    const newStage = over.id as string;

    const originalDeals = [...deals];
    const dealToUpdate = deals.find(d => d.id === dealId);

    if (!dealToUpdate) return;

    // Optimistic update
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

    try {
      await updateDeal(dealId, { stage: newStage });
      toast({ title: "Sucesso", description: "Negociação movida." });
    } catch (error) {
      // Revert on error
      setDeals(originalDeals);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível mover a negociação." });
    }
  };

  const openDealModal = (deal: Deal | null) => {
    setDealForModal(deal);
    setIsDealModalOpen(true);
  };
  
  const onDealUpdated = () => {
    refreshDeals();
  }

  const handleCardClick = (dealId: string) => {
    router.push(`/dashboard/vendas/pipelines/${dealId}`);
  }

  return (
    <>
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Select
            value={selectedPipelineId ?? ""}
            onValueChange={(value) => {
              setSelectedPipelineId(value);
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione um pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setIsPipelinesModalOpen(true)}
          >
            Gerenciar Pipelines
          </Button>
        </div>
        <Button onClick={() => openDealModal(null)} disabled={!selectedPipelineId}>Adicionar Negociação</Button>
      </div>
      
      <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
        <DndContext onDragEnd={onDragEnd}>
            {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-80 space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ))
            ) : selectedPipeline ? (
                selectedPipeline.stages.map((stage) => {
                    const dealsInStage = deals.filter((deal) => deal.stage === stage);
                    const totalValue = dealsInStage.reduce((sum, deal) => sum + deal.value, 0);

                    return (
                        <KanbanColumn key={stage} id={stage} title={`${stage} (${formatCurrency(totalValue)})`}>
                            {dealsInStage.map((deal) => (
                                <DealCard 
                                    key={deal.id} 
                                    deal={deal} 
                                    onClick={() => handleCardClick(deal.id)}
                                    isSelected={false} 
                                />
                            ))}
                        </KanbanColumn>
                    );
                })
            ) : (
                <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground">Selecione um pipeline para começar.</p>
                </div>
            )}
        </DndContext>
      </div>


      <ManagePipelinesModal
        isOpen={isPipelinesModalOpen}
        onClose={() => setIsPipelinesModalOpen(false)}
        onPipelinesUpdated={refreshPipelines}
      />
      {isDealModalOpen && (
         <DealModal
            isOpen={isDealModalOpen}
            onClose={() => setIsDealModalOpen(false)}
            deal={dealForModal}
            pipelines={pipelines}
            contacts={contacts}
            employees={employees}
            onDealUpdated={onDealUpdated}
        />
      )}
    </>
  );
}
