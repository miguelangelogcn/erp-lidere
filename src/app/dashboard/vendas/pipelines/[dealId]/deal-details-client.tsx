'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { DealComments } from '../deal-comments';
import type { Deal } from '../firestore-types'; // Use a central type definition

interface DealDetailsClientProps {
    deal: Deal;
}

export function DealDetailsClient({ deal: initialDeal }: DealDetailsClientProps) {
    const [deal, setDeal] = useState(initialDeal);

    // TODO: Adicionar lógica para abrir modal de edição
    const handleEdit = () => {
        console.log("Abrir modal de edição para:", deal.id);
    }

    return (
        <div className="space-y-6">
            <Link href="/dashboard/vendas/pipelines" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Pipelines
            </Link>

            <Tabs defaultValue="details" className="w-full">
                <div className='flex justify-between items-start'>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{deal.title}</h1>
                        <p className="text-muted-foreground">Gerencie todos os detalhes desta negociação.</p>
                    </div>
                    <TabsList>
                        <TabsTrigger value="details">Detalhes</TabsTrigger>
                        <TabsTrigger value="activities">Atividades</TabsTrigger>
                        <TabsTrigger value="notes">Notas</TabsTrigger>
                    </TabsList>
                </div>


                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Negociação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold">Valor</p>
                                    <p className="text-primary text-lg font-bold">{formatCurrency(deal.value)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Contato</p>
                                    <p>{deal.contactName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Responsável</p>
                                    <p>{deal.ownerName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Pipeline</p>
                                    <p>{deal.pipelineId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Estágio Atual</p>
                                    <p>{deal.stage}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activities">
                    <Card>
                         <CardHeader>
                            <CardTitle>Atividades</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Aqui fica o histórico de atividades.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes">
                   <Card>
                         <CardHeader>
                            <CardTitle>Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <DealComments dealId={deal.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
