"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Paperclip } from 'lucide-react';
import { Mentorship, addMentorship, getMentorships } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';

const formSchema = z.object({
  video: z.any().refine(file => file?.length == 1, "Vídeo é obrigatório."),
  transcript: z.string().min(1, "Transcrição é obrigatória."),
  attachments: z.any().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function MentorshipsTab({ followUpId }: { followUpId: string }) {
    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = getMentorships(followUpId, setMentorships);
        return () => unsubscribe();
    }, [followUpId]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { transcript: '' }
    });

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            // Upload video
            const videoFile = values.video[0];
            const videoPath = `followUps/${followUpId}/mentorships/${Date.now()}_${videoFile.name}`;
            const videoUrl = await uploadFile(videoPath, videoFile);

            // Upload attachments
            const attachmentUrls = [];
            if (values.attachments && values.attachments.length > 0) {
                for (const file of Array.from(values.attachments as FileList)) {
                    const filePath = `followUps/${followUpId}/mentorships/${Date.now()}_${file.name}`;
                    const url = await uploadFile(filePath, file);
                    attachmentUrls.push({ name: file.name, url });
                }
            }
            
            await addMentorship(followUpId, {
                videoUrl,
                transcript: values.transcript,
                attachments: attachmentUrls,
            });

            toast({ title: 'Sucesso', description: 'Mentoria adicionada.' });
            form.reset();
            setIsFormOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar a mentoria.' });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card>
            <CardHeader className='flex-row justify-between items-center'>
                <div>
                    <CardTitle>Mentorias</CardTitle>
                    <CardDescription>Vídeos e registros das sessões de mentoria.</CardDescription>
                </div>
                <Button onClick={() => setIsFormOpen(true)}><PlusCircle className='mr-2 h-4 w-4' /> Adicionar Mentoria</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {mentorships.map(m => (
                    <div key={m.id} className="p-4 border rounded-lg">
                        <video src={m.videoUrl} controls className="w-full rounded-md mb-2"></video>
                        <p className="text-sm text-muted-foreground mb-2">
                           Registrado em: {m.createdAt ? format(m.createdAt, 'dd/MM/yyyy HH:mm') : '...'}
                        </p>
                        <p className="whitespace-pre-wrap">{m.transcript}</p>
                        {m.attachments.length > 0 && (
                            <div className='mt-4'>
                                <h4 className='font-semibold'>Anexos:</h4>
                                <ul className='list-disc list-inside'>
                                    {m.attachments.map(att => (
                                        <li key={att.url}>
                                            <a href={att.url} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
                                                <Paperclip className='inline-block mr-1 h-4 w-4'/>{att.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
                {mentorships.length === 0 && <p className="text-center text-muted-foreground p-4">Nenhuma mentoria adicionada ainda.</p>}
            </CardContent>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Mentoria</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="video" render={({ field }) => (<FormItem><FormLabel>Vídeo da Mentoria</FormLabel><FormControl><Input type="file" accept="video/*" {...form.register('video')} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="transcript" render={({ field }) => (<FormItem><FormLabel>Transcrição</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="attachments" render={({ field }) => (<FormItem><FormLabel>Anexos (Opcional)</FormLabel><FormControl><Input type="file" multiple {...form.register('attachments')} /></FormControl><FormMessage /></FormItem>)}/>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
                        </DialogFooter>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
