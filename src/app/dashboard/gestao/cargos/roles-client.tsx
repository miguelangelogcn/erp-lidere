"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2 } from "lucide-react";

import { Role, addRole, updateRole, deleteRole, systemPages, getRoles } from "@/lib/firebase/firestore";
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
  DialogTrigger,
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
    AlertDialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(1, "O nome do cargo é obrigatório."),
  permissions: z.record(z.boolean()),
});

type RoleFormValues = z.infer<typeof formSchema>;

export function RolesClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const refreshData = async () => {
    setPageLoading(true);
    try {
        const rolesData = await getRoles();
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
    if (user) {
        refreshData();
    }
  }, [user]);


  const form = useForm<RoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      permissions: systemPages.reduce((acc, page) => ({ ...acc, [page.id]: false }), {}),
    },
  });

  const handleDialogOpen = (role: Role | null) => {
    setSelectedRole(role);
    if (role) {
      form.reset({
        name: role.name,
        permissions: {
            ...systemPages.reduce((acc, page) => ({ ...acc, [page.id]: false }), {}),
            ...role.permissions
        },
      });
    } else {
      form.reset({
        name: "",
        permissions: systemPages.reduce((acc, page) => ({ ...acc, [page.id]: false }), {}),
      });
    }
    setIsFormOpen(true);
  };

  const handleDeleteAlertOpen = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteAlertOpen(true);
  }

  const onSubmit = async (values: RoleFormValues) => {
    setLoading(true);
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, values);
        toast({ title: "Sucesso", description: "Cargo atualizado." });
      } else {
        await addRole(values);
        toast({ title: "Sucesso", description: "Cargo criado." });
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
    if (!selectedRole) return;
    setLoading(true);
    try {
        await deleteRole(selectedRole.id);
        toast({ title: "Sucesso", description: "Cargo excluído." });
        await refreshData();
        setIsDeleteAlertOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o cargo." });
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
                Adicionar Cargo
            </Button>
        </div>
        <DialogContent className="sm:max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{selectedRole ? "Editar Cargo" : "Adicionar Cargo"}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do cargo e defina as permissões.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Gerente de Vendas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                    <FormLabel>Permissões</FormLabel>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto p-1">
                        {systemPages.map((page) => (
                            <FormField
                                key={page.id}
                                control={form.control}
                                name={`permissions.${page.id}`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>{page.label}</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente o cargo.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          {pageLoading ? (
             <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDialogOpen(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteAlertOpen(role)} className="text-destructive focus:text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
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
