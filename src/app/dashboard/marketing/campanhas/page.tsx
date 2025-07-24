
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCampaigns, Campaign } from '@/lib/firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2, Edit, History, Send } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function CampanhasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

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
      if (!response.ok) throw new Error(result.error || "Falha ao disparar.");

      toast({ title: "Sucesso!", description: "Disparo registrado! O envio está em andamento." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
    } finally {
      setDispatchingId(null);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Campanhas de Marketing</h1>
        <Button onClick={() => router.push('/dashboard/marketing/campanhas/nova')}>
          Criar Nova Campanha
        </Button>
      </div>

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
                  <TableCell>{(campaign.contactIds || []).length}</TableCell>
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
  );
}
