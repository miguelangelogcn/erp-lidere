"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Campaign, getCampaigns, deleteCampaign, getDispatchesByCampaignId } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MoreHorizontal, Send, Trash, History, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function CampanhasPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

    const refreshData = async () => {
        setPageLoading(true);
        try {
            const data = await getCampaigns();
            setCampaigns(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as campanhas." });
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleSendCampaign = async (campaignId: string) => {
        setActionLoading(campaignId);
        try {
            const response = await fetch(`/api/marketing/campanhas/${campaignId}/send`, { method: 'POST' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Falha ao disparar campanha.");
            toast({ title: "Sucesso!", description: `Campanha disparada para ${result.dispatchedCount} contatos.` });
            refreshData();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleDeleteRequest = (campaign: Campaign) => {
        setCampaignToDelete(campaign);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if(!campaignToDelete) return;
        setActionLoading(campaignToDelete.id);
        try {
            await deleteCampaign(campaignToDelete.id);
            toast({ title: "Sucesso", description: "Campanha excluída."});
            refreshData();
            setIsDeleteAlertOpen(false);
            setCampaignToDelete(null);
        } catch (error) {
             toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a campanha." });
        } finally {
            setActionLoading(null);
        }
    }


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Campanhas de Marketing</h1>
                    <p className="text-muted-foreground">Crie, gerencie e dispare suas campanhas de webhook.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/marketing/campanhas/nova">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Campanha
                    </Link>
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {pageLoading ? (
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome da Campanha</TableHead>
                                    <TableHead>Nº de Contatos</TableHead>
                                    <TableHead>Data de Criação</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.length > 0 ? campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{(campaign.contactIds || []).length} contatos</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {campaign.createdAt ? format(campaign.createdAt.toDate(), 'dd/MM/yyyy') : '...'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleSendCampaign(campaign.id)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === campaign.id ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Send className="mr-2 h-4 w-4" />
                                                )}
                                                Disparar
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 ml-2">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDeleteRequest(campaign)}>
                                                        <Trash className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Nenhuma campanha criada.</TableCell>
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
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a campanha.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={!!actionLoading}>
                             {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}