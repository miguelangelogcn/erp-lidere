"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Campaign, getCampaigns, deleteCampaign } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit, Trash, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSendAlertOpen, setIsSendAlertOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as campanhas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDeleteRequest = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteAlertOpen(true);
  };
  
  const handleSendRequest = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsSendAlertOpen(true);
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCampaign) return;
    setActionLoading(true);
    try {
      await deleteCampaign(selectedCampaign.id);
      toast({ title: "Sucesso", description: "Campanha excluída." });
      await fetchCampaigns();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a campanha." });
    } finally {
      setActionLoading(false);
      setIsDeleteAlertOpen(false);
    }
  };
  
  const handleSendConfirm = async () => {
    if(!selectedCampaign) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/marketing/disparos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaign.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao disparar campanha');

      toast({ title: "Sucesso!", description: result.message });
      await fetchCampaigns();

    } catch (error: any) {
        toast({ variant: 'destructive', title: "Erro ao Enviar", description: error.message});
    } finally {
        setActionLoading(false);
        setIsSendAlertOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Campanhas de Marketing</h1>
          <p className="text-muted-foreground">Crie e gerencie suas campanhas de e-mail e WhatsApp.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/marketing/campanhas/nova')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Nova Campanha
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campanhas Salvas</CardTitle>
          <CardDescription>Visualize, edite ou envie suas campanhas.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Canais</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                          {campaign.status === 'draft' ? 'Rascunho' : 'Enviada'}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.contactIds.length}</TableCell>
                      <TableCell className="capitalize">{campaign.channels.join(', ')}</TableCell>
                      <TableCell>{campaign.createdAt ? format(campaign.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/marketing/campanhas/${campaign.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                             {campaign.status === 'draft' && (
                                <>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={() => handleSendRequest(campaign)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Disparar Campanha
                                </DropdownMenuItem>
                               </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteRequest(campaign)} className="text-destructive focus:text-destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhuma campanha criada ainda.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a campanha.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       <AlertDialog open={isSendAlertOpen} onOpenChange={setIsSendAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Disparo?</AlertDialogTitle>
              <AlertDialogDescription>A campanha será enviada para {selectedCampaign?.contactIds.length} contato(s). Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSendConfirm} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
