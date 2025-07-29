
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash, Check, ChevronsUpDown } from "lucide-react";
import {
  Deal,
  Pipeline,
  Contact,
  Employee,
  Note,
  addDeal,
  updateDeal,
  deleteDeal,
  addNote,
  getNotes
} from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandList, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";


const dealFormSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  value: z.coerce.number().min(0, "O valor deve ser positivo."),
  pipelineId: z.string().min(1, "O pipeline é obrigatório."),
  stage: z.string().min(1, "O estágio é obrigatório."),
  contactId: z.string().min(1, "O contato é obrigatório."),
  ownerId: z.string().min(1, "O responsável é obrigatório."),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

const noteFormSchema = z.object({
    content: z.string().min(1, "O conteúdo da nota não pode estar vazio.")
});
type NoteFormValues = z.infer<typeof noteFormSchema>;

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  pipelines: Pipeline[];
  contacts: Contact[];
  employees: Employee[];
  onDealUpdated: () => void;
}

export function DealModal({ isOpen, onClose, deal, pipelines, contacts, employees, onDealUpdated }: DealModalProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: "",
      value: 0,
      pipelineId: "",
      stage: "",
      contactId: "",
      ownerId: "",
    },
  });

  const noteForm = useForm<NoteFormValues>({
      resolver: zodResolver(noteFormSchema),
      defaultValues: { content: "" }
  });

  const selectedPipelineId = form.watch("pipelineId");
  const stages = pipelines.find(p => p.id === selectedPipelineId)?.stages || [];

  useEffect(() => {
    if (deal) {
      form.reset(deal);
    } else {
      // Find the first pipeline and its first stage for default values
      const defaultPipeline = pipelines[0];
      const defaultStage = defaultPipeline?.stages[0] || "";
      form.reset({
        title: "",
        value: 0,
        pipelineId: defaultPipeline?.id || "",
        stage: defaultStage,
        contactId: "",
        ownerId: user?.uid || "",
      });
    }
  }, [deal, pipelines, isOpen, user, form]);

  useEffect(() => {
    if (deal?.id) {
      const unsubscribe = getNotes(deal.id, setNotes);
      return () => unsubscribe();
    } else {
        setNotes([]);
    }
  }, [deal]);


  const onSubmit = async (values: DealFormValues) => {
    setLoading(true);
    try {
      if (deal) {
        await updateDeal(deal.id, values);
        toast({ title: "Sucesso", description: "Negociação atualizada." });
      } else {
        await addDeal(values);
        toast({ title: "Sucesso", description: "Negociação criada." });
      }
      onDealUpdated();
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  const onNoteSubmit = async (values: NoteFormValues) => {
    if(!deal || !user?.email) return;
    setLoading(true);
    try {
        await addNote(deal.id, { content: values.content, author: user.email });
        noteForm.reset();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar a nota." });
    } finally {
        setLoading(false);
    }
  }

  const onDeleteConfirm = async () => {
    if (!deal) return;
    setLoading(true);
    try {
        await deleteDeal(deal.id);
        toast({ title: "Sucesso", description: "Negociação excluída." });
        onDealUpdated();
        onClose();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a negociação." });
    } finally {
        setLoading(false);
        setIsDeleteAlertOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{deal ? "Editar Negociação" : "Nova Negociação"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="notes" disabled={!deal}>Notas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="value" render={({ field }) => (<FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="pipelineId" render={({ field }) => (<FormItem><FormLabel>Pipeline</FormLabel><Select onValueChange={(value) => { field.onChange(value); form.setValue('stage', pipelines.find(p=>p.id === value)?.stages[0] || '') }} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{pipelines.map(p=>(<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="stage" render={({ field }) => (<FormItem><FormLabel>Estágio</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{stages.map(s=>(<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="contactId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                          <FormLabel>Contato</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                >
                                  {field.value
                                    ? contacts.find(
                                        (contact) => contact.id === field.value
                                      )?.name
                                    : "Selecione um contato"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar contato..." />
                                <CommandList>
                                <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {contacts.map((contact) => (
                                    <CommandItem
                                      value={contact.name}
                                      key={contact.id}
                                      onSelect={() => {
                                        form.setValue("contactId", contact.id)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          contact.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {contact.name}
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
                  <FormField control={form.control} name="ownerId" render={({ field }) => (<FormItem><FormLabel>Responsável</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger></FormControl><SelectContent>{employees.map(e=>(<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <DialogFooter className="pt-4">
                    {deal && (
                        <Button type="button" variant="destructive" onClick={() => setIsDeleteAlertOpen(true)} disabled={loading} className="mr-auto"><Trash className="mr-2 h-4 w-4" /> Excluir</Button>
                    )}
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-4 pt-4">
                <Form {...noteForm}>
                    <form onSubmit={noteForm.handleSubmit(onNoteSubmit)} className="space-y-2">
                         <FormField control={noteForm.control} name="content" render={({ field }) => (<FormItem><FormLabel>Nova Nota</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                         <Button type="submit" size="sm" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar Nota</Button>
                    </form>
                </Form>
                <ScrollArea className="h-64">
                    <div className="space-y-4 pr-4">
                        {notes.map(note => (
                            <div key={note.id} className="text-sm p-3 bg-muted/50 rounded-md">
                                <p className="whitespace-pre-wrap">{note.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">{note.author} - {note.createdAt ? format(note.createdAt, 'dd/MM/yyyy HH:mm') : '...'}</p>
                            </div>
                        ))}
                         {notes.length === 0 && <p className="text-sm text-center text-muted-foreground pt-4">Nenhuma nota adicionada.</p>}
                    </div>
                </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a negociação.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

    
