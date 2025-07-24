
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useToast } from "@/hooks/use-toast";
import { getContacts, Contact as ContactType } from "@/lib/firebase/firestore";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface WhatsAppTemplate {
    id: string;
    name: string;
    language: string;
    status: string;
}

const campaignFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  contactIds: z.array(z.string()).min(1, "Selecione pelo menos um contato."),
  channels: z.array(z.string()).min(1, "Selecione pelo menos um canal."),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  whatsappTemplateName: z.string().optional(),
}).refine(data => {
    if (data.channels.includes('email')) {
        return !!data.emailSubject && !!data.emailBody;
    }
    return true;
}, {
    message: "Assunto e corpo do e-mail são obrigatórios para o canal E-mail.",
    path: ["emailSubject"],
}).refine(data => {
    if (data.channels.includes('whatsapp')) {
        return !!data.whatsappTemplateName;
    }
    return true;
}, {
    message: "A seleção de um modelo do WhatsApp é obrigatória.",
    path: ["whatsappTemplateName"],
});


type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function NovaCampanhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      contactIds: [],
      channels: [],
      emailSubject: "",
      emailBody: "",
      whatsappTemplateName: "",
    },
  });

  const selectedChannels = form.watch("channels") || [];
  const selectedContactIds = form.watch("contactIds") || [];


  useEffect(() => {
    async function loadContacts() {
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os contatos." });
      }
    }
    loadContacts();
  }, [toast]);
  
  useEffect(() => {
    if (selectedChannels.includes('whatsapp')) {
      const fetchTemplates = async () => {
        setTemplatesLoading(true);
        try {
          const response = await fetch('/api/whatsapp/templates');
          if (!response.ok) throw new Error('Falha ao buscar modelos.');
          const data = await response.json();
          setWhatsAppTemplates(data);
        } catch (error) {
           toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os modelos do WhatsApp." });
        } finally {
            setTemplatesLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [selectedChannels, toast]);

  const onSubmit = async (data: CampaignFormValues) => {
    setLoading(true);

    const payload = {
      name: data.name,
      contactIds: data.contactIds,
      channels: data.channels,
      emailContent: data.channels.includes('email') ? {
        subject: data.emailSubject,
        body: data.emailBody,
      } : undefined,
      whatsappContent: data.channels.includes('whatsapp') ? {
        templateName: data.whatsappTemplateName
      } : undefined,
    };

    try {
      const response = await fetch('/api/marketing/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao salvar campanha.");
      
      toast({ title: "Sucesso!", description: "Campanha criada com sucesso." });
      router.push('/dashboard/marketing/campanhas');

    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Criar Nova Campanha</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Campanha</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
          
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
                              {contacts.map((contact) => (
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

            <FormField control={form.control} name="channels" render={() => (
                <FormItem>
                    <FormLabel>Canais</FormLabel>
                    <div className="flex items-center gap-4">
                        <FormField control={form.control} name="channels" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes('email')}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), 'email'])
                                            : field.onChange((field.value || [])?.filter((v) => v !== 'email'))
                                        }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">E-mail</FormLabel>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="channels" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes('whatsapp')}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), 'whatsapp'])
                                            : field.onChange((field.value || [])?.filter((v) => v !== 'whatsapp'))
                                        }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">WhatsApp</FormLabel>
                            </FormItem>
                        )}/>
                    </div>
                    <FormMessage />
                </FormItem>
            )}/>


            {selectedChannels.includes("email") && (
              <div className="border p-4 rounded-md space-y-4">
                <h2 className="font-semibold">Conteúdo do E-mail</h2>
                <FormField control={form.control} name="emailSubject" render={({ field }) => (<FormItem><FormLabel>Assunto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="emailBody" render={({ field }) => (<FormItem><FormLabel>Corpo</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            )}
            
            {selectedChannels.includes("whatsapp") && (
              <div className="border p-4 rounded-md space-y-4">
                <h2 className="font-semibold">Conteúdo do WhatsApp</h2>
                <FormField
                  control={form.control}
                  name="whatsappTemplateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo da Mensagem</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={templatesLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={templatesLoading ? "Carregando modelos..." : "Selecione um modelo"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {whatsAppTemplates.map(template => (
                            <SelectItem key={template.id} value={template.name}>
                              {template.name} ({template.language})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}


            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Campanha
            </Button>
        </form>
      </Form>
    </div>
  );
}
