
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Contact, getContacts } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


const formSchema = (channel: 'email' | 'whatsapp') => z.object({
  recipients: z.array(z.string()).min(1, "Selecione pelo menos um destinatário."),
  subject: z.string().optional(),
  message: z.string().min(1, "A mensagem é obrigatória."),
}).refine(data => {
    if (channel === 'email') {
        return !!data.subject && data.subject.trim().length > 0;
    }
    return true;
}, {
    message: "O assunto é obrigatório para e-mails.",
    path: ["subject"],
});

type FormValues = z.infer<ReturnType<typeof formSchema>>;

export function DisparosClient() {
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>("email");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(activeTab)),
    defaultValues: { recipients: [], subject: "", message: "" },
  });
  
  // Re-run validation when tab changes
  useEffect(() => {
    form.trigger();
  }, [activeTab, form]);


  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);
      } catch (error) {
         toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os contatos.' });
      }
    };
    fetchContacts();
  }, [toast]);
  
  useEffect(() => {
    form.reset({ recipients: [], subject: "", message: "" });
  }, [activeTab, form]);


  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
        const response = await fetch('/api/marketing/disparos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...values,
                channel: activeTab
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Falha ao enviar o disparo.');
        }
        
        toast({
            title: "Disparo enviado!",
            description: `Sua mensagem para ${values.recipients.length} contato(s) foi enviada com sucesso.`,
        });
        form.reset();

    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: "Erro no Disparo",
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compor Mensagem</CardTitle>
        <CardDescription>Crie sua mensagem e selecione os destinatários.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'email' | 'whatsapp')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="recipients"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Destinatários</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>
                            <span className="line-clamp-1">
                              {field.value?.length > 0
                                ? `${field.value.length} contato(s) selecionado(s)`
                                : "Selecionar contatos"}
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
                              {contacts.map((contact) => (
                                <CommandItem
                                  value={contact.name}
                                  key={contact.id}
                                  onSelect={() => {
                                    const currentValues = field.value || [];
                                    const newValue = currentValues.includes(contact.id)
                                      ? currentValues.filter((id) => id !== contact.id)
                                      : [...currentValues, contact.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(contact.id) ? "opacity-100" : "opacity-0")} />
                                  {contact.name} ({activeTab === 'email' ? contact.email : contact.phone})
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

              {activeTab === "email" && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <FormControl>
                        <Input placeholder="Assunto do e-mail" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Escreva sua mensagem aqui..." rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
  );
}
