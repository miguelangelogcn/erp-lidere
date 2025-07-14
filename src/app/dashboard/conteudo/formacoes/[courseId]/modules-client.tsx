
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2, GripVertical } from "lucide-react";
import { Module, addModule, updateModule, deleteModule, getModules } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  order: z.coerce.number().min(0, "A ordem deve ser um número positivo."),
});
type FormValues = z.infer<typeof formSchema>;

export function CourseModulesClient({ courseId }: { courseId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const refreshData = async () => {
    setPageLoading(true);
    try {
      const data = await getModules(courseId);
      setModules(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os módulos." });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [courseId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", order: 0 },
  });

  const handleDialogOpen = (module: Module | null) => {
    setSelectedModule(module);
    if (module) {
        form.reset(module);
    } else {
        const nextOrder = modules.length > 0 ? Math.max(...modules.map(m => m.order)) + 1 : 1;
        form.reset({ title: "", order: nextOrder });
    }
    setIsFormOpen(true);
  };

  const handleDeleteAlertOpen = (module: Module) => {
    setSelectedModule(module);
    setIsDeleteAlertOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (selectedModule) {
        await updateModule(courseId, selectedModule.id, values);
        toast({ title: "Sucesso", description: "Módulo atualizado." });
      } else {
        await addModule(courseId, values);
        toast({ title: "Sucesso", description: "Módulo criado." });
      }
      await refreshData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedModule) return;
    setLoading(true);
    try {
      await deleteModule(courseId, selectedModule.id);
      toast({ title: "Sucesso", description: "Módulo excluído." });
      await refreshData();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o módulo." });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (moduleId: string) => {
      router.push(`/dashboard/conteudo/formacoes/${courseId}/${moduleId}`);
  }

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="flex justify-end mt-4">
          <Button onClick={() => handleDialogOpen(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Módulo
          </Button>
        </div>
        <DialogContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader><DialogTitle>{selectedModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Módulo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação excluirá o módulo e todas as aulas contidas nele.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4 mt-6">
        {pageLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : (
          modules.map((module) => (
            <Card key={module.id} className="flex items-center p-4">
                <GripVertical className="h-5 w-5 text-muted-foreground mr-4 cursor-grab" />
                <div onClick={() => handleCardClick(module.id)} className="flex-grow cursor-pointer">
                    <p className="font-medium">{module.title}</p>
                    <p className="text-sm text-muted-foreground">Ordem: {module.order}</p>
                </div>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDialogOpen(module)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDeleteAlertOpen(module)}><Trash className="h-4 w-4 text-destructive" /></Button>
            </Card>
          ))
        )}
         {modules.length === 0 && !pageLoading && (
            <p className="text-center text-muted-foreground p-8">Nenhum módulo criado ainda.</p>
        )}
      </div>
    </>
  );
}

    