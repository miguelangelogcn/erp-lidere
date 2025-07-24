
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Campaign, Dispatch, getDoc, doc, db, getDispatchesByCampaignId } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistoricoDisparosPage({ params }: { params: { campaignId: string } }) {
    const router = useRouter();
    const campaignId = params.campaignId;
    const { toast } = useToast();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [dispatches, setDispatches] = useState<Dispatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!campaignId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const campaignDocRef = doc(db, 'campaigns', campaignId);
                const [campaignDoc, dispatchesData] = await Promise.all([
                    getDoc(campaignDocRef),
                    getDispatchesByCampaignId(campaignId)
                ]);

                if (campaignDoc.exists()) {
                    setCampaign({ id: campaignDoc.id, ...campaignDoc.data() } as Campaign);
                } else {
                     toast({ variant: 'destructive', title: 'Erro', description: 'Campanha não encontrada.' });
                     router.push('/dashboard/marketing/campanhas');
                }
                setDispatches(dispatchesData);

            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o histórico.' });
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [campaignId, toast, router]);

    return (
        <div className="space-y-4">
             <Button variant="ghost" onClick={() => router.back()} className="px-0 hover:bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Campanhas
            </Button>
             <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Histórico de Disparos: {loading ? <Skeleton className="h-8 w-1/2 inline-block" /> : campaign?.name}
                </h1>
                <p className="text-muted-foreground">Visualize todos os envios realizados para esta campanha.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Disparos Registrados</CardTitle>
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
                                <TableHead>Data do Disparo</TableHead>
                                <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dispatches.length > 0 ? (
                                    dispatches.map((dispatch) => (
                                        <TableRow key={dispatch.id}>
                                            <TableCell>
                                                {dispatch.dispatchDate ? format(dispatch.dispatchDate, 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={dispatch.status === 'success' ? 'default' : 'destructive'}>
                                                    {dispatch.status === 'success' ? 'Sucesso' : 'Falha'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">Nenhum disparo registrado para esta campanha.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
