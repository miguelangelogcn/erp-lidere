'use client';

import { useState } from 'react';
import type { Deal } from '@/lib/firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DealComments } from '../deal-comments';
import { Separator } from '@/components/ui/separator';

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

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{deal.title}</CardTitle>
                        <CardDescription>Detalhes da Negociação</CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-semibold">Valor</p>
                            <p className="text-primary text-lg font-bold">{formatCurrency(deal.value)}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Contato</p>
                            <p>{deal.contactName}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Responsável</p>
                            <p>{deal.ownerName}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Pipeline</p>
                            <p>{deal.pipelineId}</p> 
                        </div>
                        <div>
                            <p className="font-semibold">Estágio Atual</p>
                            <p>{deal.stage}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="pt-4">
                        <h3 className="text-lg font-semibold mb-2">Histórico de Notas</h3>
                        <DealComments dealId={deal.id} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
