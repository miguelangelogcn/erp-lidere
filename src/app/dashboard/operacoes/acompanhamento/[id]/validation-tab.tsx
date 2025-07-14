"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Download } from 'lucide-react';
import { ActionPlanTask, getActionPlanTasks, updateActionPlanTask } from '@/lib/firebase/firestore';

export function ValidationTab({ followUpId }: { followUpId: string }) {
    const [tasks, setTasks] = useState<ActionPlanTask[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = getActionPlanTasks(followUpId, (allTasks) => {
            setTasks(allTasks.filter(t => t.status === 'completed'));
        });
        return () => unsubscribe();
    }, [followUpId]);

    const handleValidation = async (taskId: string, newStatus: 'validated' | 'pending') => {
        setLoading(true);
        try {
            await updateActionPlanTask(followUpId, taskId, { status: newStatus });
            toast({ title: 'Sucesso', description: `Tarefa ${newStatus === 'validated' ? 'aprovada' : 'rejeitada'}.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar a tarefa.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Validação de Tarefas</CardTitle>
                <CardDescription>Aprove ou rejeite as tarefas enviadas pelo cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {tasks.map(task => (
                    <div key={task.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                            <p>{task.text}</p>
                            {task.submittedFileUrl && (
                                <a href={task.submittedFileUrl} target='_blank' rel='noopener noreferrer' className='text-sm text-primary hover:underline mt-1 inline-block'>
                                    <Download className='inline-block mr-1 h-4 w-4'/>Ver anexo
                                </a>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="outline" className="text-green-600 hover:text-green-600 hover:bg-green-100" onClick={() => handleValidation(task.id, 'validated')} disabled={loading}>
                                <Check className='h-5 w-5' />
                            </Button>
                            <Button size="icon" variant="outline" className="text-red-600 hover:text-red-600 hover:bg-red-100" onClick={() => handleValidation(task.id, 'pending')} disabled={loading}>
                                 <X className='h-5 w-5' />
                            </Button>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && <p className="text-center text-muted-foreground p-4">Nenhuma tarefa para validar no momento.</p>}
                 {loading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
            </CardContent>
        </Card>
    );
}
