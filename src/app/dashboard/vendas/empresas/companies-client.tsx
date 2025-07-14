"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2 } from "lucide-react";

import { Company, addCompany, updateCompany, deleteCompany, getCompanies } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  website: z.string().url("URL inválida.").optional().or(z.literal('')),
  phone: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof formSchema>;

export function CompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const refreshData = async () => {
    try {
        if (!user) return;
        setPageLoading(true);
        const data = await getCompanies();
        setCompanies(data);
    } catch (error) {
        console.error("Error fetching companies:", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as empresas." });
    } finally {
        setPageLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, [user]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", website: "", phone: "" },
  });

  const handleDialogOpen = (company: Company | null) => {
    setSelectedCompany(company);
    if (company) {
      form.reset(company);
    } else {
      form.reset({ name: "", website: "", phone: "" });
    }
    setIsFormOpen(true);
  };

  const handleDeleteAlertOpen = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteAlertOpen(true);
  }

  const onSubmit = async (values: CompanyFormValues) => {
    setLoading(true);
    try {
      if (selectedCompany) {
        await updateCompany(selectedCompany.id, values);
        toast({ title: "Sucesso", description: "Empresa atualizada." });
      } else {
        await addCompany(values);
        toast({ title: "Sucesso", description: "Empresa adicionada." });
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
    if (!selectedCompany) return;
    setLoading(true);
    try {
        await deleteCompany(selectedCompany.id);
        toast({ title: "Sucesso", description: "Empresa excluída." });
        await refreshData();
        setIsDeleteAlertOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a empresa." });
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
                Adicionar Empresa
            </Button>
        </div>
        <DialogContent className="sm:max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{selectedCompany ? "Editar Empresa" : "Adicionar Empresa"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome da Empresa" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="website" render={({ field }) => ( <FormItem><FormLabel>Website</FormLabel><FormControl><Input type="url" placeholder="https://site.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem> )} />
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
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a empresa.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader><CardTitle>Lista de Empresas</CardTitle></CardHeader>
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
                    <TableHead>Website</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.website}</TableCell>
                      <TableCell>{company.phone}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDialogOpen(company)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAlertOpen(company)} className="text-destructive focus:text-destructive"><Trash className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
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
