"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ActionPlanTask, addActionPlanTask, getActionPlanTasks } from '@/lib/firebase/firestore';

const formSchema = z.object({
  text: z.string().min(1, "A tarefa não pode estar vazia."),
});
type FormValues = z.infer<typeof formSchema>;

const statusConfig = {
    pending: { icon: Clock, color: "text-muted-foreground", label: "Pendente" },
    completed: { icon: AlertCircle, color: "text-blue-500", label: "Enviado p/ Validação" },
    validated: { icon: CheckCircle, color: "text-green-500", label: "Validado" },
}

export function ActionPlanTab({ followUpId }: { followUpId: string }) {
    const [tasks, setTasks] = useState<ActionPlanTask[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = getActionPlanTasks(followUpId, setTasks);
        return () => unsubscribe();
    }, [followUpId]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { text: '' }
    });

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            await addActionPlanTask(followUpId, values.text);
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar a tarefa.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plano de Ação</CardTitle>
                <CardDescription>Crie tarefas para o cliente executar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                        <FormField control={form.control} name="text" render={({ field }) => (<FormItem className='flex-grow'><FormControl><Input placeholder="Nova tarefa..." {...field} /></FormControl></FormItem>)}/>
                        <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar</Button>
                    </form>
                </Form>
                <div className="space-y-2">
                    {tasks.map(task => {
                        const Icon = statusConfig[task.status].icon;
                        return (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                <span className={task.status === 'validated' ? 'line-through text-muted-foreground' : ''}>{task.text}</span>
                                <div className={`flex items-center gap-1 text-sm ${statusConfig[task.status].color}`}>
                                    <Icon className="h-4 w-4" />
                                    <span>{statusConfig[task.status].label}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
                 {tasks.length === 0 && <p className="text-center text-muted-foreground p-4">Nenhuma tarefa no plano de ação.</p>}
            </CardContent>
        </Card>
    );
}
