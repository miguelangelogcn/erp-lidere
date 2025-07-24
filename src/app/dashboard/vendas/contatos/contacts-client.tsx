
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2, UserPlus } from "lucide-react";

import { Contact, addContact, updateContact, deleteContact, getContacts, createStudentFromContact } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  phone: z.string().optional(),
});
type ContactFormValues = z.infer<typeof formSchema>;


const grantAccessSchema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});
type GrantAccessFormValues = z.infer<typeof grantAccessSchema>;

const bulkTagFormSchema = z.object({
  tag: z.string().min(1, "A tag é obrigatória."),
});
type BulkTagFormValues = z.infer<typeof bulkTagFormSchema>;


export function ContactsClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [bulkTagAction, setBulkTagAction] = useState<'add' | 'remove' | null>(null);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const refreshData = async () => {
    try {
        if (!user) return;
        setPageLoading(true);
        const data = await getContacts();
        setContacts(data);
        setSelectedRowKeys([]);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os contatos." });
    } finally {
        setPageLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, [user]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });
  
  const grantAccessForm = useForm<GrantAccessFormValues>({
    resolver: zodResolver(grantAccessSchema),
    defaultValues: { password: "" },
  });

  const bulkTagForm = useForm<BulkTagFormValues>({
      resolver: zodResolver(bulkTagFormSchema),
      defaultValues: { tag: "" },
  });

  const handleDialogOpen = (contact: Contact | null) => {
    setSelectedContact(contact);
    if (contact) {
      form.reset(contact);
    } else {
      form.reset({ name: "", email: "", phone: "" });
    }
    setIsFormOpen(true);
  };

  const handleGrantAccessOpen = (contact: Contact) => {
    setSelectedContact(contact);
    grantAccessForm.reset();
    setIsGrantAccessOpen(true);
  };

  const handleDeleteAlertOpen = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteAlertOpen(true);
  }
  
  const handleBulkTagOpen = (action: 'add' | 'remove') => {
      setBulkTagAction(action);
      setIsBulkTagModalOpen(true);
  }

  const onSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    try {
      if (selectedContact) {
        await updateContact(selectedContact.id, values);
        toast({ title: "Sucesso", description: "Contato atualizado." });
      } else {
        await addContact(values);
        toast({ title: "Sucesso", description: "Contato adicionado." });
      }
      await refreshData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  const onGrantAccessSubmit = async (values: GrantAccessFormValues) => {
    if (!selectedContact) return;
    setLoading(true);
    try {
        await createStudentFromContact(selectedContact, values.password);
        toast({ title: "Sucesso!", description: `${selectedContact.name} agora é um aluno.` });
        await refreshData();
        setIsGrantAccessOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível conceder o acesso." });
    } finally {
        setLoading(false);
    }
  };


  const onDeleteConfirm = async () => {
    if (!selectedContact) return;
    setLoading(true);
    try {
        await deleteContact(selectedContact.id);
        toast({ title: "Sucesso", description: "Contato excluído." });
        await refreshData();
        setIsDeleteAlertOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o contato." });
    } finally {
        setLoading(false);
    }
  }

  const handleBulkDeleteConfirm = async () => {
    setLoading(true);
    try {
        const response = await fetch('/api/contacts/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactIds: selectedRowKeys }),
        });
        const result = await response.json();
        if(!response.ok) throw new Error(result.error || 'Falha na exclusão em lote');
        toast({ title: "Sucesso", description: `${selectedRowKeys.length} contato(s) excluído(s).` });
        await refreshData();
        setIsBulkDeleteAlertOpen(false);
    } catch(error) {
        toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
    } finally {
        setLoading(false);
    }
  }

  const onBulkTagSubmit = async (values: BulkTagFormValues) => {
    if (!bulkTagAction) return;
    setLoading(true);
    try {
        const response = await fetch('/api/contacts/bulk-tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contactIds: selectedRowKeys,
                tag: values.tag,
                action: bulkTagAction,
            }),
        });
        const result = await response.json();
        if(!response.ok) throw new Error(result.error || `Falha ao ${bulkTagAction === 'add' ? 'adicionar' : 'remover'} tag.`);
        toast({ title: "Sucesso", description: result.message });
        await refreshData();
        setIsBulkTagModalOpen(false);
        bulkTagForm.reset();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
    } finally {
        setLoading(false);
    }
  }


  return (
    <>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={selectedRowKeys.length === 0}>
                            Ações <MoreHorizontal className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBulkTagOpen('add')}>Adicionar Tag</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkTagOpen('remove')}>Remover Tag</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsBulkDeleteAlertOpen(true)} className="text-destructive focus:text-destructive">
                           <Trash className="mr-2 h-4 w-4" /> Excluir Selecionados ({selectedRowKeys.length})
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Button onClick={() => handleDialogOpen(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Contato
            </Button>
        </div>

      {/* Modals and Dialogs */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader><DialogTitle>{selectedContact ? "Editar Contato" : "Adicionar Contato"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@dominio.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
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

      <Dialog open={isGrantAccessOpen} onOpenChange={setIsGrantAccessOpen}>
          <DialogContent className="sm:max-w-md">
            <Form {...grantAccessForm}>
                <form onSubmit={grantAccessForm.handleSubmit(onGrantAccessSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Conceder Acesso de Aluno</DialogTitle>
                        <DialogDescription>Crie um acesso para {selectedContact?.name} e defina uma senha inicial.</DialogDescription>
                    </DialogHeader>
                     <div className="space-y-4 py-4">
                        <Input value={selectedContact?.name} disabled className="font-medium" />
                        <Input value={selectedContact?.email} disabled />
                        <FormField control={grantAccessForm.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Senha Inicial</FormLabel>
                                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar e Criar Acesso
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
              <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o contato.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente os {selectedRowKeys.length} contatos selecionados.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Excluir Contatos</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBulkTagModalOpen} onOpenChange={setIsBulkTagModalOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{bulkTagAction === 'add' ? 'Adicionar Tag em Massa' : 'Remover Tag em Massa'}</DialogTitle>
                  <DialogDescription>
                      {bulkTagAction === 'add' ? 'Digite a tag que você deseja adicionar aos' : 'Digite a tag que você deseja remover dos'} {selectedRowKeys.length} contatos selecionados.
                  </DialogDescription>
              </DialogHeader>
              <Form {...bulkTagForm}>
                  <form onSubmit={bulkTagForm.handleSubmit(onBulkTagSubmit)} className="space-y-4">
                      <FormField
                          control={bulkTagForm.control}
                          name="tag"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Tag</FormLabel>
                                  <FormControl><Input placeholder="Ex: Lead Qualificado" {...field} /></FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <DialogFooter>
                          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                          <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Lista de Contatos</CardTitle></CardHeader>
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
                    <TableHead className="w-[50px]">
                        <Checkbox 
                            checked={contacts.length > 0 && selectedRowKeys.length === contacts.length}
                            onCheckedChange={(checked) => {
                                if(checked) {
                                    setSelectedRowKeys(contacts.map(c => c.id));
                                } else {
                                    setSelectedRowKeys([]);
                                }
                            }}
                            aria-label="Selecionar todas as linhas"
                        />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {contacts.map((contact) => (
                    <TableRow key={contact.id} data-state={selectedRowKeys.includes(contact.id) && "selected"}>
                      <TableCell>
                          <Checkbox 
                            checked={selectedRowKeys.includes(contact.id)}
                            onCheckedChange={(checked) => {
                                if(checked) {
                                    setSelectedRowKeys(prev => [...prev, contact.id]);
                                } else {
                                    setSelectedRowKeys(prev => prev.filter(id => id !== contact.id));
                                }
                            }}
                            aria-label={`Selecionar linha para ${contact.name}`}
                          />
                      </TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.phone}</TableCell>
                       <TableCell>
                         <div className="flex flex-wrap gap-1">
                            {contact.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                         </div>
                      </TableCell>
                      <TableCell>
                          {contact.userId ? <Badge>Aluno</Badge> : <Badge variant="secondary">Contato</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDialogOpen(contact)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            {!contact.userId && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleGrantAccessOpen(contact)}><UserPlus className="mr-2 h-4 w-4"/>Conceder Acesso de Aluno</DropdownMenuItem>
                                </>
                            )}
                             <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteAlertOpen(contact)} className="text-destructive focus:text-destructive"><Trash className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
           )}
           {contacts.length === 0 && !pageLoading && (
                <div className="text-center p-8 text-muted-foreground">Nenhum contato encontrado.</div>
           )}
        </CardContent>
      </Card>
    </>
  );
}
