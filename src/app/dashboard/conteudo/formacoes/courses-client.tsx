
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2 } from "lucide-react";
import { Course, addCourse, updateCourse, deleteCourse, getCourses } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  description: z.string().min(1, "A descrição é obrigatória."),
});
type FormValues = z.infer<typeof formSchema>;

export function CoursesClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const refreshData = async () => {
    setPageLoading(true);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os cursos." });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "" },
  });

  const handleDialogOpen = (course: Course | null) => {
    setSelectedCourse(course);
    form.reset(course || { title: "", description: "" });
    setIsFormOpen(true);
  };

  const handleDeleteAlertOpen = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteAlertOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (selectedCourse) {
        await updateCourse(selectedCourse.id, values);
        toast({ title: "Sucesso", description: "Curso atualizado." });
      } else {
        await addCourse(values);
        toast({ title: "Sucesso", description: "Curso criado." });
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
    if (!selectedCourse) return;
    setLoading(true);
    try {
      await deleteCourse(selectedCourse.id);
      toast({ title: "Sucesso", description: "Curso excluído." });
      await refreshData();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o curso." });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCardClick = (courseId: string) => {
    router.push(`/dashboard/conteudo/formacoes/${courseId}`);
  }

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="flex justify-end">
          <Button onClick={() => handleDialogOpen(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Curso
          </Button>
        </div>
        <DialogContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{selectedCourse ? "Editar Curso" : "Novo Curso"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
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
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá o curso e todos os seus módulos e aulas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {pageLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between">
                <div onClick={() => handleCardClick(course.id)} className="cursor-pointer flex-grow">
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-3">{course.description}</CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDialogOpen(course)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteAlertOpen(course)} className="text-destructive focus:text-destructive"><Trash className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
               <CardContent className="flex-grow"></CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
