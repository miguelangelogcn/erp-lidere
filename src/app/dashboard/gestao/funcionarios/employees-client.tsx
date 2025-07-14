"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2 } from "lucide-react";

import { Employee, Role, updateEmployee, deleteEmployee, getEmployees, getRoles } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Schema for adding a new employee (includes password)
const addFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
  roleId: z.string().min(1, "O cargo é obrigatório."),
});

// Schema for editing an employee (password is not required/editable here)
const editFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  roleId: z.string().min(1, "O cargo é obrigatório."),
});

type AddEmployeeFormValues = z.infer<typeof addFormSchema>;
type EditEmployeeFormValues = z.infer<typeof editFormSchema>;

export function EmployeesClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const isEditing = !!selectedEmployee;

  const form = useForm({
    resolver: zodResolver(isEditing ? editFormSchema : addFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  const refreshData = async () => {
    setPageLoading(true);
    try {
        if (!user) return;
        const [employeesData, rolesData] = await Promise.all([getEmployees(), getRoles()]);
        setEmployees(employeesData);
        setRoles(rolesData);
    } catch (error) {
        console.error("Firebase permission error:", error);
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
  }, [user]);

  useEffect(() => {
    if (isEditing) {
        form.reset({
            name: selectedEmployee.name,
            email: selectedEmployee.email,
            roleId: selectedEmployee.roleId,
            password: "" // Clear password on edit
        });
    } else {
        form.reset({ name: "", email: "", password: "", roleId: "" });
    }
  }, [isFormOpen, selectedEmployee, form, isEditing]);


  const handleDialogOpen = (employee: Employee | null) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDeleteAlertOpen = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteAlertOpen(true);
  }

  const onSubmit = async (values: AddEmployeeFormValues | EditEmployeeFormValues) => {
    setLoading(true);
    try {
      if (isEditing && selectedEmployee) {
        await updateEmployee(selectedEmployee.id, { name: values.name, roleId: values.roleId });
        toast({ title: "Sucesso", description: "Funcionário atualizado." });
      } else {
         const response = await fetch('/api/create-user', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(values),
         });
         const result = await response.json();
         if (!response.ok) {
             throw new Error(result.error || "Falha ao criar usuário");
         }
        toast({ title: "Sucesso", description: "Funcionário adicionado." });
      }
      await refreshData();
      setIsFormOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
        await deleteEmployee(selectedEmployee.id);
        toast({ title: "Sucesso", description: "Funcionário excluído." });
        await refreshData();
        setIsDeleteAlertOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o funcionário." });
    } finally {
        setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="flex justify-end">
            <Button onClick={() => handleDialogOpen(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Funcionário
            </Button>
        </div>
        <DialogContent className="sm:max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do funcionário. A senha será usada para o primeiro login.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@dominio.com" {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                 {!isEditing && (
                    <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 )}
                 <FormField control={form.control} name="roleId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cargo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {roles.map(role => (<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o funcionário.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continuar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader><CardTitle>Lista de Funcionários</CardTitle></CardHeader>
        <CardContent>
           {pageLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
            </div>
           ) : (
            <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Cargo</TableHead><TableHead className="w-[100px] text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                {employees.map((employee) => (
                    <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDialogOpen(employee)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAlertOpen(employee)} className="text-destructive focus:text-destructive"><Trash className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
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
