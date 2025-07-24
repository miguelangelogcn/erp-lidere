
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCampaigns, Campaign, getOngoingDispatches, Dispatch } from '@/lib/firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Loader2, Edit, History, Send, Trash, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

function OngoingDispatches() {
    const [dispatches, setDispatches] = useState<Dispatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = getOngoingDispatches((ongoingDispatches) => {
            setDispatches(ongoingDispatches);
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on component unmount
    }, []);

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
                        <div key={dispatch.id}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{dispatch.campaignName}</span>
                                <span className="text-sm text-muted-foreground">{dispatch.processedContacts} / {dispatch.totalContacts}</span>
                            </div>
                            <Progress value={progressValue} />
                            <p className="text-xs text-muted-foreground mt-1 capitalize">Status: {dispatch.status}</p>
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
