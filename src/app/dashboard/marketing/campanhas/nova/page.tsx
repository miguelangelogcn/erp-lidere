
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { Contact, getContacts, addCampaign } from "@/lib/firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";


const campaignFormSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório."),
  subject: z.string().min(1, "O assunto do e-mail é obrigatório."),
  body: z.string().min(1, "O corpo do e-mail é obrigatório."),
  contactIds: z.array(z.string()).min(1, "Selecione pelo menos um contato."),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function NovaCampanhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: { name: "", subject: "", body: "", contactIds: [] },
  });

  useEffect(() => {
    const fetchContacts = async () => {
        setPageLoading(true);
        try {
            const contactsData = await getContacts();
            setAllContacts(contactsData);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os contatos." });
        } finally {
            setPageLoading(false);
        }
    }
    fetchContacts();
  }, [toast]);
  
  const selectedContactIds = form.watch("contactIds") || [];

  const onSubmit = async (values: CampaignFormValues) => {
    setLoading(true);
    try {
      await addCampaign(values);
      toast({ title: "Sucesso!", description: "Campanha criada com sucesso." });
      router.push('/dashboard/marketing/campanhas');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a campanha." });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Card>
                  <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                  <CardContent className="space-y-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-10 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push("/dashboard/marketing/campanhas")} className="px-0 hover:bg-transparent">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Campanhas
      </Button>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Nova Campanha</CardTitle>
                    <CardDescription>Preencha os detalhes abaixo para criar sua campanha de e-mail.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Nome da Campanha</FormLabel><FormControl><Input placeholder="Ex: Lançamento de Natal" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Assunto do E-mail</FormLabel><FormControl><Input placeholder="O título que seus contatos verão" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="body" render={({ field }) => (
                        <FormItem><FormLabel>Corpo do E-mail</FormLabel><FormControl><Textarea rows={15} placeholder="Escreva a sua mensagem aqui... Use {{name}} para personalizar com o nome do contato." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>

                    <FormField
                        control={form.control}
                        name="contactIds"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Destinatários</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" role="combobox" className={cn("w-full justify-between", selectedContactIds.length === 0 && "text-muted-foreground")}>
                                    <span className="line-clamp-1">
                                      {selectedContactIds.length > 0
                                        ? `${selectedContactIds.length} contato(s) selecionado(s)`
                                        : "Selecione os contatos"}
                                    </span>
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
                                      {allContacts.map((contact) => (
                                        <CommandItem
                                          value={contact.name}
                                          key={contact.id}
                                          onSelect={() => {
                                            const currentValues = field.value || [];
                                            const newValue = currentValues.includes(contact.id)
                                              ? currentValues.filter(id => id !== contact.id)
                                              : [...currentValues, contact.id];
                                            field.onChange(newValue);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(contact.id) ? "opacity-100" : "opacity-0")} />
                                          <div className="flex flex-col">
                                            <span>{contact.name}</span>
                                            <span className="text-xs text-muted-foreground">{contact.email}</span>
                                          </div>
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

                </CardContent>
            </Card>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Enviar Campanha
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
