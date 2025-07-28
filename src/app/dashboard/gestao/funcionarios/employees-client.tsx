
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CustomField } from "@/app/dashboard/settings/employees/fields-client";


const baseSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  roleId: z.string().min(1, "O cargo é obrigatório."),
  customData: z.record(z.any()).optional(),
});

const addFormSchema = baseSchema.extend({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

const editFormSchema = baseSchema;


type AddEmployeeFormValues = z.infer<typeof addFormSchema>;
type EditEmployeeFormValues = z.infer<typeof editFormSchema>;

export function EmployeesClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

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
  });

  const refreshData = async () => {
    setPageLoading(true);
    try {
        if (!user) return;
        const [employeesData, rolesData, fieldsData] = await Promise.all([
            getEmployees(), 
            getRoles(),
            fetch('/api/settings/employee-fields').then(res => res.json())
        ]);
        setEmployees(employeesData);
        setRoles(rolesData);
        setCustomFields(fieldsData);
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
    const defaultValues: any = {
      name: "",
      email: "",
      roleId: "",
      customData: {},
    };
    if (isEditing && selectedEmployee) {
        form.reset({
            name: selectedEmployee.name,
            email: selectedEmployee.email,
            roleId: selectedEmployee.roleId,
            customData: selectedEmployee.customData || {}
        });
    } else {
        form.reset({
            ...defaultValues,
            password: "",
        });
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
        await updateEmployee(selectedEmployee.id, { 
            name: values.name, 
            roleId: values.roleId,
            customData: values.customData 
        });
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
        <DialogContent className="sm:max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do funcionário.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] p-1">
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                 {customFields.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                         <h4 className="text-md font-medium">Informações Adicionais</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customFields.map((field) => (
                                <FormField
                                    key={field.id}
                                    control={form.control}
                                    name={`customData.${field.key}`}
                                    render={({ field: formField }) => (
                                        <FormItem>
                                            <FormLabel>{field.label}</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type={field.fieldType} 
                                                    {...formField} 
                                                    value={formField.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
              </div>
              </ScrollArea>
              <DialogFooter className="border-t pt-4 mt-4">
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
