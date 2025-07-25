
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCampaigns, Campaign, Dispatch, deleteCampaign } from '@/lib/firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Loader2, Edit, History, Send, Trash, PlusCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

function OngoingDispatches() {
    const [dispatches, setDispatches] = useState<Dispatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const { toast } = useToast();


    useEffect(() => {
        const q = query(
            collection(db, 'dispatches'), 
            where('status', 'in', ['processing', 'queued']),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ongoingDispatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispatch));
            setDispatches(ongoingDispatches);
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on component unmount
    }, []);

    const handleCancelDispatch = async (dispatchId: string) => {
        setCancellingId(dispatchId);
        try {
            const response = await fetch(`/api/marketing/dispatches/${dispatchId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Falha ao cancelar disparo.");
            toast({ title: "Sucesso", description: "Disparo cancelado."});
            // The onSnapshot listener will automatically remove the item from the UI
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: (error as Error).message });
        } finally {
            setCancellingId(null);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
        )
    }
    
    if (dispatches.length === 0) {
        return null; // Don't render anything if there are no ongoing dispatches
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Disparos em Andamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {dispatches.map(dispatch => {
                    const progressValue = dispatch.totalContacts > 0 ? (dispatch.processedContacts / dispatch.totalContacts) * 100 : 0;
                    return (
                        <div key={dispatch.id} className="p-3 rounded-md bg-muted/50">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{dispatch.campaignName}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleCancelDispatch(dispatch.id)}
                                    disabled={cancellingId === dispatch.id}
                                >
                                    {cancellingId === dispatch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Progress value={progressValue} />
                             <p className="text-xs text-muted-foreground mt-2">
                               {dispatch.processedContacts} de {dispatch.totalContacts} enviados ({dispatch.status})
                             </p>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}


export default function CampanhasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const campaignsData = await getCampaigns();
      setCampaigns(campaignsData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as campanhas." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDispatch = async (campaignId: string) => {
    setDispatchingId(campaignId);
    try {
      const response = await fetch(`/api/marketing/campanhas/${campaignId}/send`, {
        method: 'POST',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao enfileirar campanha.");

      toast({ title: "Sucesso!", description: "Campanha enfileirada para disparo." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDeleteRequest = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCampaign) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/marketing/campanhas/${selectedCampaign.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao excluir.');

      toast({ title: "Sucesso", description: "Campanha excluída." });
      fetchCampaigns(); // Re-fetch the list
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    try {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return format(timestamp.toDate(), 'dd/MM/yyyy');
        }
    } catch (e) {}
    return 'Data inválida';
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Campanhas de Marketing</h1>
                <p className="text-muted-foreground">Crie, gerencie e dispare suas campanhas de e-mail e WhatsApp.</p>
            </div>
          <Button onClick={() => router.push('/dashboard/marketing/campanhas/nova')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Nova Campanha
          </Button>
        </div>
        
        <OngoingDispatches />

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Canais</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : campaigns.length > 0 ? (
                campaigns.map(campaign => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{(campaign.contactIds?.length || 0) > 0 ? (campaign.contactIds?.length) : 'Tags'}</TableCell>
                    <TableCell>{(campaign.channels || []).join(', ')}</TableCell>
                    <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={dispatchingId === campaign.id}>
                            {dispatchingId === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/marketing/campanhas/${campaign.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDispatch(campaign.id)}>
                            <Send className="mr-2 h-4 w-4" /> Disparar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/marketing/campanhas/${campaign.id}/historico`)}>
                            <History className="mr-2 h-4 w-4" /> Ver Histórico
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteRequest(campaign)} className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma campanha criada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a campanha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
