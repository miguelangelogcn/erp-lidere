"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import { Contact, getContacts } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  contactIds: z.array(z.string()).min(1, "Selecione ao menos um contato."),
  subject: z.string(),
  message: z.string().min(1, "A mensagem não pode estar em branco."),
});

type FormValues = z.infer<typeof formSchema>;

export function DisparosClient() {
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  const [loading, setLoading] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsData = await getContacts();
        setAllContacts(contactsData);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os contatos." });
      }
    };
    fetchContacts();
  }, [toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema.refine(data => activeTab === 'email' ? !!data.subject : true, {
      message: "O assunto é obrigatório para e-mail.",
      path: ["subject"],
    })),
    defaultValues: { contactIds: [], subject: "", message: "" },
  });
  
  const selectedContactIds = form.watch("contactIds") || [];

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const response = await fetch('/api/marketing/disparos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: activeTab,
          contactIds: values.contactIds,
          subject: values.subject,
          message: values.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro desconhecido.");
      }

      toast({ title: "Sucesso!", description: result.message });
      form.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no Disparo", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Disparos de Marketing</h1>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Compor Mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">E-mail</TabsTrigger>
              <TabsTrigger value="whatsapp" disabled>WhatsApp (Em breve)</TabsTrigger>
            </TabsList>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                <TabsContent value="email" className="space-y-6 m-0">
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
                                        const newValue = selectedContactIds.includes(contact.id)
                                          ? selectedContactIds.filter(id => id !== contact.id)
                                          : [...selectedContactIds, contact.id];
                                        field.onChange(newValue);
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", selectedContactIds.includes(contact.id) ? "opacity-100" : "opacity-0")} />
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
                  <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem><FormLabel>Assunto</FormLabel><FormControl><Input placeholder="Assunto do e-mail" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="message" render={({ field }) => ( <FormItem><FormLabel>Mensagem</FormLabel><FormControl><Textarea rows={10} placeholder="Escreva sua mensagem aqui..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                </TabsContent>
                <TabsContent value="whatsapp">
                    <p className="text-center text-muted-foreground p-8">A funcionalidade de disparo por WhatsApp estará disponível em breve.</p>
                </TabsContent>
                 <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Disparo
                    </Button>
                 </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}