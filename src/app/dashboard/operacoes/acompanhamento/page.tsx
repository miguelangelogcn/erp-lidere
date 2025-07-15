
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { FollowUp, getFollowUps, deleteFollowUp } from '@/lib/firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash, Loader2 } from 'lucide-react';
import { AddFollowUpModal } from './add-follow-up-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AcompanhamentoPage() {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getFollowUps();
            setFollowUps(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os acompanhamentos.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, toast]);
    
    const handleDeleteClick = (e: React.MouseEvent, followUp: FollowUp) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedFollowUp(followUp);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedFollowUp) return;
        setDeleteLoading(true);
        try {
            await deleteFollowUp(selectedFollowUp.id);
            toast({ title: 'Sucesso', description: 'Acompanhamento excluído.' });
            fetchData();
            setIsDeleteAlertOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o acompanhamento.' });
        } finally {
            setDeleteLoading(false);
        }
    };


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="font-headline text-3xl font-bold tracking-tight">Acompanhamento de Clientes</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Acompanhamento
                </Button>
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : followUps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {followUps.map(item => (
                        <Card key={item.id} className="hover:shadow-lg transition-shadow flex flex-col">
                            <Link href={`/dashboard/operacoes/acompanhamento/${item.id}`} className="flex-grow">
                                <CardHeader className="flex-row items-start justify-between">
                                    <CardTitle>{item.contactName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Iniciado em: {item.createdAt ? format(item.createdAt.toDate(), 'dd/MM/yyyy') : '...'}
                                    </p>
                                </CardContent>
                            </Link>
                             <div className="p-4 pt-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 ml-auto flex">
                                            <span className="sr-only">Abrir menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => handleDeleteClick(e, item)} className="text-destructive focus:text-destructive">
                                            <Trash className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">Nenhum acompanhamento encontrado.</p>
                </div>
            )}

            {isModalOpen && (
                <AddFollowUpModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onFollowUpCreated={fetchData}
                />
            )}
            
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o acompanhamento e todos os seus dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteLoading}>
                             {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
