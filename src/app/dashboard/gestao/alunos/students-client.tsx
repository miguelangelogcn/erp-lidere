
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit, MoreHorizontal, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Employee, Role, Course, updateEmployee, getStudents, getRoles, getCourses } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const editFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  assignedCourses: z.array(z.string()).optional(),
});

type EditStudentFormValues = z.infer<typeof editFormSchema>;

export function StudentsClient() {
  const [students, setStudents] = useState<Employee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<EditStudentFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { name: "", email: "", assignedCourses: [] },
  });

  const refreshData = async () => {
    setPageLoading(true);
    try {
        const [studentsData, coursesData] = await Promise.all([getStudents(), getCourses()]);
        setStudents(studentsData);
        setCourses(coursesData);
    } catch (error) {
        console.error("Firebase error:", error);
        toast({
            variant: "destructive",
            title: "Erro de Permissão",
            description: "Você não tem permissão para ver estes dados.",
        });
    } finally {
        setPageLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  const handleDialogOpen = (student: Employee | null) => {
    if (!student) return;
    setSelectedStudent(student);
    form.reset({
        name: student.name,
        email: student.email,
        assignedCourses: student.assignedCourses || [],
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: EditStudentFormValues) => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
        await updateEmployee(selectedStudent.id, {
            name: values.name,
            assignedCourses: values.assignedCourses
        });
        toast({ title: "Sucesso", description: "Aluno atualizado." });
        await refreshData();
        setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Editar Aluno</DialogTitle>
                <DialogDescription>Atualize os dados e os cursos atribuídos ao aluno.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@dominio.com" {...field} disabled /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField
                    control={form.control}
                    name="assignedCourses"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Cursos Atribuídos</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                >
                                <span className="line-clamp-1">
                                {field.value && field.value.length > 0
                                ? field.value.map(val => courses.find(c => c.id === val)?.title).filter(Boolean).join(", ")
                                : "Selecione os cursos"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar curso..." />
                                <CommandList>
                                <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                                <CommandGroup>
                                {courses.map((course) => (
                                    <CommandItem
                                        value={course.title}
                                        key={course.id}
                                        onSelect={() => {
                                            const currentValues = field.value || [];
                                            const newValue = currentValues.includes(course.id)
                                            ? currentValues.filter(id => id !== course.id)
                                            : [...currentValues, course.id];
                                            field.onChange(newValue);
                                        }}
                                    >
                                    <Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(course.id) ? "opacity-100" : "opacity-0")} />
                                    {course.title}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader><CardTitle>Lista de Alunos</CardTitle></CardHeader>
        <CardContent>
           {pageLoading ? (
            <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
           ) : (
            <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Cursos</TableHead><TableHead className="w-[100px] text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                {students.map((student) => (
                    <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{(student.assignedCourses || []).length} curso(s)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDialogOpen(student)}><Edit className="mr-2 h-4 w-4" /> Gerenciar</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </>
  );
}

    