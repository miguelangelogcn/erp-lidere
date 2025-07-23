
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2 } from "lucide-react";

import {
  FinancialDebt,
  getFinancialDebts,
  addFinancialDebt,
  updateFinancialDebt,
  deleteFinancialDebt,
} from "@/lib/firebase/firestore";

import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  name: z.string().min(1, "O nome da dívida é obrigatório."),
  creditor: z.string().min(1, "O nome do credor é obrigatório."),
  totalValue: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  interestRate: z.string().min(1, "A taxa de juros é obrigatória."),
});

type FormValues = z.infer<typeof formSchema>;

export function DebtsClient() {
  const [debts, setDebts] = useState<FinancialDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<FinancialDebt | null>(null);
  
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getFinancialDebts();
      setDebts(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as dívidas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (debt: FinancialDebt | null) => {
    setSelectedDebt(debt);
    if (debt) {
      form.reset(debt);
    } else {
      form.reset({
        name: "",
        creditor: "",
        totalValue: 0,
        interestRate: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (debt: FinancialDebt) => {
    setSelectedDebt(debt);
    setIsDeleteAlertOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setActionLoading(true);
    try {
      if (selectedDebt) {
        await updateFinancialDebt(selectedDebt.id, values);
        toast({ title: "Sucesso", description: "Dívida atualizada." });
      } else {
        await addFinancialDebt(values);
        toast({ title: "Sucesso", description: "Dívida adicionada." });
      }
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro ao salvar a dívida." });
    } finally {
      setActionLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedDebt) return;
    setActionLoading(true);
    try {
      await deleteFinancialDebt(selectedDebt.id);
      toast({ title: "Sucesso", description: "Dívida excluída." });
      fetchData();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a dívida." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
        <div className="flex justify-end items-center mb-4">
          <Button onClick={() => handleOpenDialog(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Dívida
          </Button>
        </div>
      <Card>
        <CardHeader>
            <CardTitle>Dívidas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nome da Dívida</TableHead>
                    <TableHead>Credor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Taxa de Juros</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {debts.length > 0 ? (
                    debts.map((debt) => (
                        <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.name}</TableCell>
                        <TableCell>{debt.creditor}</TableCell>
                        <TableCell>{formatCurrency(debt.totalValue)}</TableCell>
                        <TableCell>{debt.interestRate}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(debt)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDeleteDialog(debt)} className="text-destructive focus:text-destructive"><Trash className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">Nenhuma dívida encontrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDebt ? "Editar Dívida" : "Adicionar Dívida"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome da Dívida</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="creditor" render={({ field }) => (
                <FormItem><FormLabel>Credor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="totalValue" render={({ field }) => (
                    <FormItem><FormLabel>Valor Total (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="interestRate" render={({ field }) => (
                  <FormItem><FormLabel>Taxa de Juros</FormLabel><FormControl><Input placeholder="Ex: 1.5% a.m." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={actionLoading}>{actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a dívida.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
