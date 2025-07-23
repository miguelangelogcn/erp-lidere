"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, PlusCircle, Edit, Trash, MoreHorizontal, Loader2 } from "lucide-react";

import {
  FinancialAccount,
  FinancialAccountType,
  RecurrenceType,
  getFinancialAccounts,
  addFinancialAccount,
  updateFinancialAccount,
  deleteFinancialAccount,
  Timestamp,
} from "@/lib/firebase/firestore";

import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória."),
  value: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  category: z.string().min(1, "A categoria é obrigatória."),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]),
});

type FormValues = z.infer<typeof formSchema>;

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
    { value: "none", label: "Nenhuma" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensal" },
    { value: "yearly", label: "Anual" },
];

export function AccountsClient() {
  const [activeTab, setActiveTab] = useState<FinancialAccountType>("receivable");
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getFinancialAccounts(activeTab);
      setAccounts(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as contas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenDialog = (account: FinancialAccount | null) => {
    setSelectedAccount(account);
    if (account) {
      form.reset({
        ...account,
        dueDate: account.dueDate.toDate(),
      });
    } else {
      form.reset({
        description: "",
        value: 0,
        dueDate: new Date(),
        category: "",
        recurrence: "none",
      });
    }
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (account: FinancialAccount) => {
    setSelectedAccount(account);
    setIsDeleteAlertOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setActionLoading(true);
    try {
      const accountData = {
        ...values,
        dueDate: Timestamp.fromDate(values.dueDate),
        type: activeTab,
      };

      if (selectedAccount) {
        await updateFinancialAccount(selectedAccount.id, accountData);
        toast({ title: "Sucesso", description: "Conta atualizada." });
      } else {
        await addFinancialAccount(accountData as Omit<FinancialAccount, 'id' | 'createdAt'>);
        toast({ title: "Sucesso", description: "Conta adicionada." });
      }
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro ao salvar a conta." });
    } finally {
      setActionLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedAccount) return;
    setActionLoading(true);
    try {
      await deleteFinancialAccount(selectedAccount.id);
      toast({ title: "Sucesso", description: "Conta excluída." });
      fetchData();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a conta." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FinancialAccountType)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
            <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
          </TabsList>
          <Button onClick={() => handleOpenDialog(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Conta
          </Button>
        </div>
        <TabsContent value="receivable">
          <AccountsTable
            accounts={accounts}
            loading={loading}
            onEdit={handleOpenDialog}
            onDelete={handleOpenDeleteDialog}
          />
        </TabsContent>
        <TabsContent value="payable">
          <AccountsTable
            accounts={accounts}
            loading={loading}
            onEdit={handleOpenDialog}
            onDelete={handleOpenDeleteDialog}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAccount ? "Editar Conta" : "Adicionar Conta"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="value" render={({ field }) => (
                    <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem className="flex flex-col pt-2"><FormLabel className="mb-1">Data de Vencimento</FormLabel>
                    <Popover><PopoverTrigger asChild>
                      <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button></FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent></Popover><FormMessage />
                  </FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="recurrence" render={({ field }) => (
                  <FormItem><FormLabel>Recorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {recurrenceOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
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
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a conta.</AlertDialogDescription></AlertDialogHeader>
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

interface AccountsTableProps {
  accounts: FinancialAccount[];
  loading: boolean;
  onEdit: (account: FinancialAccount) => void;
  onDelete: (account: FinancialAccount) => void;
}

function AccountsTable({ accounts, loading, onEdit, onDelete }: AccountsTableProps) {
    if (loading) {
        return (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
        )
    }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length > 0 ? (
                accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.description}</TableCell>
                  <TableCell>{formatCurrency(account.value)}</TableCell>
                  <TableCell>{format(account.dueDate.toDate(), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{account.category}</TableCell>
                  <TableCell>{recurrenceOptions.find(o => o.value === account.recurrence)?.label}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(account)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(account)} className="text-destructive focus:text-destructive"><Trash className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhuma conta encontrada.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
