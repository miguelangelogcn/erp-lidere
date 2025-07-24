
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Check, ChevronsUpDown, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Campaign, Contact, getContacts, getDoc, doc, db, updateCampaign } from "@/lib/firebase/firestore";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const campaignFormSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório."),
  contactIds: z.array(z.string()).optional(),
  channels: z.array(z.string()).min(1, "Selecione pelo menos um canal."),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
}).refine(data => {
    if (data.channels.includes('email')) {
        return !!data.emailSubject && !!data.emailBody;
    }
    return true;
}, {
    message: "Assunto e corpo do e-mail são obrigatórios para o canal E-mail.",
    path: ["emailSubject"],
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const channelOptions = [
    { id: 'email', label: 'E-mail' },
    { id: 'whatsapp', label: 'WhatsApp (em breve)', disabled: true },
]

export default function EditCampanhaPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.campaignId as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: { name: "", contactIds: [], channels: [], emailSubject: "", emailBody: "" },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
        if (!campaignId) return;
        setPageLoading(true);
        try {
            const campaignDocRef = doc(db, 'campaigns', campaignId);
            const [contactsData, campaignDoc] = await Promise.all([
                getContacts(),
                getDoc(campaignDocRef)
            ]);
            setAllContacts(contactsData);

            if(campaignDoc.exists()) {
                const campaignData = { id: campaignDoc.id, ...campaignDoc.data() } as Campaign;
                form.reset({
                    name: campaignData.name,
                    contactIds: campaignData.contactIds,
                    channels: campaignData.channels,
                    emailSubject: campaignData.emailContent?.subject || "",
                    emailBody: campaignData.emailContent?.body || "",
                });
            } else {
                 toast({ variant: "destructive", title: "Erro", description: "Campanha não encontrada." });
                 router.push('/dashboard/marketing/campanhas');
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados." });
        } finally {
            setPageLoading(false);
        }
    }
    fetchInitialData();
  }, [campaignId, toast, router, form]);


  const selectedChannels = form.watch("channels") || [];
  const selectedContactIds = form.watch("contactIds") || [];

  const handleSave = async (values: CampaignFormValues) => {
     setLoading(true);
    try {
      await updateCampaign(campaignId, {
        name: values.name,
        channels: values.channels as ('email' | 'whatsapp')[],
        contactIds: values.contactIds || [],
        emailContent: values.channels.includes('email') ? {
          subject: values.emailSubject || "",
          body: values.emailBody || "",
        } : undefined,
      });
      toast({ title: "Sucesso!", description: "Campanha atualizada." });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a campanha." });
      return false;
    } finally {
        setLoading(false);
    }
  }

  const onSubmit = async (values: CampaignFormValues) => {
    await handleSave(values);
  };

  const handleSendCampaign = async () => {
      // First, trigger form validation and get current values
      const isValid = await form.trigger();
      if (!isValid) {
          toast({ variant: 'destructive', title: "Erro de Validação", description: "Por favor, corrija os erros no formulário."});
          return;
      }
      
      const values = form.getValues();
      
      // Save the latest changes
      const saveSuccessful = await handleSave(values);
      if (!saveSuccessful) return;

      // Proceed to send
      setIsSending(true);
      try {
           const response = await fetch(`/api/marketing/campanhas/${campaignId}/send`, {
                method: 'POST',
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Ocorreu um erro");
            
            toast({ title: "Campanha Enviada!", description: result.message });
            router.push('/dashboard/marketing/campanhas');

      } catch (error: any) {
          toast({ variant: 'destructive', title: "Erro ao Enviar", description: error.message});
      } finally {
          setIsSending(false);
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
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-40 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.back()} className="px-0 hover:bg-transparent">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Campanhas
      </Button>
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Editar Campanha</h1>
        <p className="text-muted-foreground">Ajuste os detalhes e envie sua campanha.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome da Campanha</FormLabel><FormControl><Input placeholder="Ex: Lançamento de Natal" {...field} /></FormControl><FormMessage /></FormItem>
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

                <FormField
                    control={form.control}
                    name="channels"
                    render={() => (
                        <FormItem>
                            <FormLabel>Canais</FormLabel>
                            <div className="flex items-center gap-4">
                                {channelOptions.map((item) => (
                                <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="channels"
                                    render={({ field }) => {
                                    return (
                                        <FormItem
                                        key={item.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                        <FormControl>
                                            <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(
                                                    (field.value || [])?.filter(
                                                        (value) => value !== item.id
                                                    )
                                                )
                                            }}
                                            disabled={item.disabled}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )
                                    }}
                                />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

              {selectedChannels.includes('email') && (
                <div className="space-y-6 border-t pt-6">
                    <CardTitle>Conteúdo do E-mail</CardTitle>
                    <FormField control={form.control} name="emailSubject" render={({ field }) => (
                        <FormItem><FormLabel>Assunto do E-mail</FormLabel><FormControl><Input placeholder="O título que seus contatos verão" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="emailBody" render={({ field }) => (
                        <FormItem><FormLabel>Corpo do E-mail</FormLabel><FormControl><Textarea rows={15} placeholder="Escreva a sua mensagem aqui..." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
              )}

            </CardContent>
          </Card>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" type="submit" disabled={loading || isSending}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Alterações
            </Button>
            <Button 
                type="button" 
                onClick={handleSendCampaign}
                disabled={loading || isSending}
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Salvar e Enviar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
