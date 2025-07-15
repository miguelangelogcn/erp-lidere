
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { FollowUp, getFollowUps } from '@/lib/firebase/firestore';
import { format } from 'date-fns';

export default function AcompanhamentoPage() {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch all follow-ups for employees
                const data = await getFollowUps();
                setFollowUps(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os acompanhamentos.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, toast]);

    return (
        <div className="space-y-4">
            <h1 className="font-headline text-3xl font-bold tracking-tight">Acompanhamento de Clientes</h1>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {followUps.map(item => (
                        <Link key={item.id} href={`/dashboard/operacoes/acompanhamento/${item.id}`} className="block h-full">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle>{item.contactName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Iniciado em: {item.createdAt ? format(item.createdAt.toDate(), 'dd/MM/yyyy') : '...'}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
