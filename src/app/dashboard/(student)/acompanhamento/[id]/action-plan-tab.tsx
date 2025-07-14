
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react';
import { ActionPlanTask, getActionPlanTasks, updateActionPlanTask } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';


const statusConfig = {
    pending: { icon: Clock, color: "text-muted-foreground", label: "Pendente" },
    completed: { icon: AlertCircle, color: "text-blue-500", label: "Enviado p/ Validação" },
    validated: { icon: CheckCircle, color: "text-green-500", label: "Validado" },
}

const formSchema = z.object({
  submittedText: z.string().min(1, "Este campo é obrigatório."),
  submittedFile: z.any().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function StudentActionPlanTab({ followUpId }: { followUpId: string }) {
    const [tasks, setTasks] = useState<ActionPlanTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<ActionPlanTask | null>(null);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = getActionPlanTasks(followUpId, setTasks);
        return () => unsubscribe();
    }, [followUpId]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { submittedText: '' }
    });

    const handleOpenSubmitModal = (task: ActionPlanTask) => {
        if (task.status !== 'pending') return;
        setSelectedTask(task);
        form.reset({ submittedText: '', submittedFile: undefined });
        setIsSubmitModalOpen(true);
    };

    const onSubmit = async (values: FormValues) => {
        if (!selectedTask) return;
        setLoading(true);
        try {
            let fileUrl = '';
            if (values.submittedFile && values.submittedFile.length > 0) {
                const file = values.submittedFile[0];
                const path = `followUps/${followUpId}/tasks/${selectedTask.id}/${file.name}`;
                fileUrl = await uploadFile(path, file);
            }
            
            await updateActionPlanTask(followUpId, selectedTask.id, {
                status: 'completed',
                submittedText: values.submittedText,
                submittedFileUrl: fileUrl || undefined,
            });
            toast({ title: 'Sucesso', description: 'Tarefa enviada para validação.' });
            setIsSubmitModalOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar a tarefa.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Plano de Ação</CardTitle>
                <CardDescription>Suas tarefas pendentes e concluídas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {tasks.map(task => {
                        const Icon = statusConfig[task.status].icon;
                        const isClickable = task.status === 'pending';
                        return (
                            <div 
                                key={task.id} 
                                className={`flex items-center justify-between p-3 bg-muted/50 rounded-md ${isClickable ? 'cursor-pointer hover:bg-muted' : ''}`}
                                onClick={() => handleOpenSubmitModal(task)}
                            >
                                <span className={task.status === 'validated' ? 'line-through text-muted-foreground' : ''}>{task.text}</span>
                                <div className={`flex items-center gap-2 text-sm ${statusConfig[task.status].color}`}>
                                    <Icon className="h-4 w-4" />
                                    <span>{statusConfig[task.status].label}</span>
                                    {isClickable && <Upload className="h-4 w-4" />}
                                </div>
                            </div>
                        )
                    })}
                </div>
                 {tasks.length === 0 && <p className="text-center text-muted-foreground p-4">Nenhuma tarefa no plano de ação.</p>}
            </CardContent>
        </Card>

        <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Concluir Tarefa</DialogTitle>
                    <DialogDescription>{selectedTask?.text}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField control={form.control} name="submittedText" render={({ field }) => (<FormItem><FormLabel>Descreva o que foi feito</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                         <FormField control={form.control} name="submittedFile" render={({ field }) => (<FormItem><FormLabel>Anexar Comprovação (Opcional)</FormLabel><FormControl><Input type="file" {...form.register('submittedFile')} /></FormControl><FormMessage /></FormItem>)}/>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar para Validação</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        </>
    );
}


    