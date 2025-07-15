
"use client";

import { useState, useEffect } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Onboarding,
  Contact,
  Product,
  getOnboardings,
  getContacts,
  getProducts,
  updateOnboarding,
  deleteOnboarding,
  addFollowUpFromOnboarding,
  getDoc,
  doc,
  db,
} from "@/lib/firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanColumn } from "./kanban-column";
import { OnboardingCard } from "./onboarding-card";
import { StartOnboardingModal } from "./start-onboarding-modal";
import { OnboardingDetailsModal } from "./onboarding-details-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

const KANBAN_COLUMNS = ["A Fazer", "Fazendo", "Feito"] as const;

export function OnboardingClient() {
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmFinishModalOpen, setIsConfirmFinishModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState<Onboarding | null>(null);
  const [onboardingToFinish, setOnboardingToFinish] = useState<Onboarding | null>(null);
  const [onboardingToDelete, setOnboardingToDelete] = useState<Onboarding | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [onboardingsData, contactsData, productsData] = await Promise.all([
        getOnboardings(),
        getContacts(),
        getProducts()
      ]);
      setOnboardings(onboardingsData);
      setContacts(contactsData);
      setProducts(productsData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados de onboarding." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const onboardingId = active.id as string;
    const newStatus = over.id as Onboarding['status'];
    const originalOnboardings = [...onboardings];
    const onboardingToMove = onboardings.find(o => o.id === onboardingId);
    
    if (!onboardingToMove) return;

    if (newStatus === "Feito") {
      const allTasksCompleted = Object.values(onboardingToMove.dailyTasks).flat().every(task => task.completed);
      if (!allTasksCompleted) {
        toast({ variant: "destructive", title: "Ação bloqueada", description: "Finalize todas as tarefas do checklist antes de mover para 'Feito'." });
        return;
      }
      setOnboardingToFinish(onboardingToMove);
      setIsConfirmFinishModalOpen(true);
      return; 
    }
    
    // Optimistic update
    setOnboardings(onboardings.map(o => o.id === onboardingId ? { ...o, status: newStatus } : o));

    try {
      await updateOnboarding(onboardingId, { status: newStatus });
    } catch (error) {
      setOnboardings(originalOnboardings);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível mover o card." });
    }
  };

  const handleFinishConfirmation = async () => {
    if (!onboardingToFinish) return;
    const originalOnboardings = [...onboardings];
    
    setIsConfirmFinishModalOpen(false);

    try {
        const contactRef = doc(db, 'contacts', onboardingToFinish.contactId);
        const contactSnap = await getDoc(contactRef);

        if (!contactSnap.exists() || !contactSnap.data()?.userId) {
            throw new Error("O contato associado não é um aluno com acesso ao sistema.");
        }
        const studentUserId = contactSnap.data()?.userId;

        setOnboardings(onboardings.map(o => o.id === onboardingToFinish.id ? { ...o, status: 'Feito' } : o));

        await updateOnboarding(onboardingToFinish.id, { status: 'Feito' });
        await addFollowUpFromOnboarding(onboardingToFinish.contactId, studentUserId, onboardingToFinish.productId);
        toast({ title: "Onboarding Concluído!", description: "Um novo registro de acompanhamento foi criado." });
    } catch (error: any) {
        setOnboardings(originalOnboardings);
        toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível finalizar o onboarding." });
    } finally {
        setOnboardingToFinish(null);
    }
  };
  
  const handleDeleteRequest = (onboarding: Onboarding) => {
    setOnboardingToDelete(onboarding);
    setIsConfirmDeleteModalOpen(true);
  }

  const handleDeleteConfirmation = async () => {
    if (!onboardingToDelete) return;
    setActionLoading(true);
    try {
      await deleteOnboarding(onboardingToDelete.id);
      toast({ title: "Sucesso", description: "Onboarding excluído." });
      await refreshData();
      setIsConfirmDeleteModalOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o onboarding." });
    } finally {
      setActionLoading(false);
      setOnboardingToDelete(null);
    }
  }


  const openDetailsModal = (onboarding: Onboarding) => {
    if (onboarding.status !== 'Fazendo') {
        toast({ title: "Ação não permitida", description: "Mova o card para 'Fazendo' para editar as tarefas."});
        return;
    }
    setSelectedOnboarding(onboarding);
    setIsDetailsModalOpen(true);
  };

  const onOnboardingUpdated = async () => {
    await refreshData();
  };

  return (
    <>
      <div className="flex-shrink-0 flex justify-end items-center mb-4">
        <Button onClick={() => setIsStartModalOpen(true)}>Iniciar Onboarding</Button>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-96 space-y-4">
                    <Skeleton className="h-8 w-1/2" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" />
                </div>
             ))
          ) : KANBAN_COLUMNS.map((status) => (
            <KanbanColumn key={status} id={status} title={status}>
                {onboardings.filter((o) => o.status === status).map((onboarding) => (
                    <OnboardingCard 
                        key={onboarding.id} 
                        onboarding={onboarding} 
                        onClick={() => openDetailsModal(onboarding)} 
                        onDelete={() => handleDeleteRequest(onboarding)}
                    />
                ))}
            </KanbanColumn>
          ))}
        </div>
      </DndContext>
      
      {isStartModalOpen && (
        <StartOnboardingModal
            isOpen={isStartModalOpen}
            onClose={() => setIsStartModalOpen(false)}
            contacts={contacts}
            products={products}
            onOnboardingStarted={refreshData}
        />
      )}

      {isDetailsModalOpen && selectedOnboarding && (
        <OnboardingDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onboarding={selectedOnboarding}
            onOnboardingUpdated={onOnboardingUpdated}
        />
      )}

      <AlertDialog open={isConfirmFinishModalOpen} onOpenChange={setIsConfirmFinishModalOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Conclusão?</AlertDialogTitle><AlertDialogDescription>Ao mover para 'Feito', um novo registro de Acompanhamento será criado para este cliente. Deseja continuar?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setOnboardingToFinish(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleFinishConfirmation}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isConfirmDeleteModalOpen} onOpenChange={setIsConfirmDeleteModalOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir este onboarding? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setOnboardingToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirmation} disabled={actionLoading}>
                     {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
