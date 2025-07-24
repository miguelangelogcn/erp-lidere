"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCampaigns, Campaign } from '@/lib/firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2 } from 'lucide-react';

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

  // Função segura para formatar a data
  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return new Date(timestamp.toDate()).toLocaleDateString('pt-BR');
    }
    return 'Pendente'; // ou outra string padrão
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Campanhas de Marketing</h1>
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
              <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
            ) : (
              campaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>{campaign.contactIds.length}</TableCell>
                  <TableCell>{campaign.channels.join(', ')}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleDispatch(campaign.id)}>
                          Disparar
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          Ver Histórico
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}