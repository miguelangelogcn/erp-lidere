
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, Loader2, GripVertical, Paperclip, Youtube } from "lucide-react";
import { Lesson, addLesson, updateLesson, deleteLesson, getLessons } from "@/lib/firebase/firestore";
import { uploadFile } from '@/lib/firebase/storage';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  order: z.coerce.number().min(0, "A ordem deve ser um número positivo."),
  videoUrl: z.string().optional(),
  videoFile: z.any().optional(),
  content: z.string().min(1, "O conteúdo é obrigatório."),
  attachments: z.any().optional(),
}).refine(data => data.videoUrl || data.videoFile, {
    message: "É necessário fornecer um link do YouTube ou um arquivo de vídeo.",
    path: ["videoUrl"],
});
type FormValues = z.infer<typeof formSchema>;

export function LessonsClient({ courseId, moduleId }: { courseId: string, moduleId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", order: 0, videoUrl: "", content: "" },
  });

  const refreshData = async () => {
    setPageLoading(true);
    try {
      const data = await getLessons(courseId, moduleId);
      setLessons(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as aulas." });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [courseId, moduleId]);

  const handleDialogOpen = (lesson: Lesson | null) => {
    setSelectedLesson(lesson);
    if (lesson) {
        form.reset({ ...lesson, videoFile: undefined, attachments: undefined });
    } else {
        const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(m => m.order)) + 1 : 1;
        form.reset({ title: "", order: nextOrder, videoUrl: "", content: "", videoFile: undefined, attachments: undefined });
    }
    setIsFormOpen(true);
  };

  const handleDeleteAlertOpen = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsDeleteAlertOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
        let videoUrl = values.videoUrl;
        if (values.videoFile && values.videoFile.length > 0) {
            const file = values.videoFile[0];
            const path = `courses/${courseId}/lessons/${Date.now()}_${file.name}`;
            videoUrl = await uploadFile(path, file);
        }

        const attachmentUrls = selectedLesson?.attachments || [];
        if (values.attachments && values.attachments.length > 0) {
             for (const file of Array.from(values.attachments as FileList)) {
                const filePath = `courses/${courseId}/lessons/attachments/${Date.now()}_${file.name}`;
                const url = await uploadFile(filePath, file);
                attachmentUrls.push({ name: file.name, url });
            }
        }
      
        const lessonData: Omit<Lesson, "id"> = {
            title: values.title,
            order: values.order,
            content: values.content,
            videoUrl: videoUrl,
            attachments: attachmentUrls,
        };

        if (selectedLesson) {
            await updateLesson(courseId, moduleId, selectedLesson.id, lessonData);
            toast({ title: "Sucesso", description: "Aula atualizada." });
        } else {
            await addLesson(courseId, moduleId, lessonData);
            toast({ title: "Sucesso", description: "Aula criada." });
        }
        await refreshData();
        setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro ao salvar a aula." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedLesson) return;
    setLoading(true);
    try {
      await deleteLesson(courseId, moduleId, selectedLesson.id);
      toast({ title: "Sucesso", description: "Aula excluída." });
      await refreshData();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a aula." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="flex justify-end mt-4">
          <Button onClick={() => handleDialogOpen(null)}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Aula</Button>
        </div>
        <DialogContent className="max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader><DialogTitle>{selectedLesson ? "Editar Aula" : "Nova Aula"}</DialogTitle></DialogHeader>
              <ScrollArea className="h-[70vh] p-1">
              <div className="space-y-4 py-4 px-2">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título da Aula</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="videoUrl" render={({ field }) => (<FormItem><FormLabel>Link do Vídeo (YouTube)</FormLabel><FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="videoFile" render={({ field }) => (<FormItem><FormLabel>Ou Envie um Vídeo</FormLabel><FormControl><Input type="file" accept="video/*" {...form.register('videoFile')} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Conteúdo da Aula</FormLabel><FormControl><Textarea rows={10} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="attachments" render={({ field }) => (<FormItem><FormLabel>Anexos</FormLabel><FormControl><Input type="file" multiple {...form.register('attachments')} /></FormControl><FormMessage /></FormItem>)} />
                 {selectedLesson?.attachments && selectedLesson.attachments.length > 0 && (
                    <div>
                        <FormLabel>Anexos existentes</FormLabel>
                        <ul className="list-disc list-inside text-sm mt-2">
                            {selectedLesson.attachments.map(att => <li key={att.url}>{att.name}</li>)}
                        </ul>
                    </div>
                )}
              </div>
              </ScrollArea>
              <DialogFooter className="mt-4 p-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4 mt-6">
        {pageLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id} className="flex items-center p-4">
                <GripVertical className="h-5 w-5 text-muted-foreground mr-4 cursor-grab" />
                <div className="flex-grow">
                    <p className="font-medium">{lesson.title}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                       <span>Ordem: {lesson.order}</span>
                       {lesson.videoUrl && <span className="flex items-center gap-1"><Youtube className="h-4 w-4" /> Vídeo</span>}
                       {lesson.attachments.length > 0 && <span className="flex items-center gap-1"><Paperclip className="h-4 w-4" /> {lesson.attachments.length} Anexos</span>}
                    </div>
                </div>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDialogOpen(lesson)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDeleteAlertOpen(lesson)}><Trash className="h-4 w-4 text-destructive" /></Button>
            </Card>
          ))
        )}
         {lessons.length === 0 && !pageLoading && (
            <p className="text-center text-muted-foreground p-8">Nenhuma aula criada ainda.</p>
        )}
      </div>
    </>
  );
}

    