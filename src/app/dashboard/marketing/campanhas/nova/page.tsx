"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Contact, getContacts } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const campaignFormSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório."),
  body: z.string().min(1, "O corpo da mensagem é obrigatório."),
  contactIds: z.array(z.string()).min(1, "Selecione ao menos um contato"),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function NovaCampanhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      body: "",
      contactIds: [],
    },
  });

  useEffect(() => {
    const fetchContacts = async () => {
      setPageLoading(true);
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os contatos." });
      } finally {
        setPageLoading(false);
      }
    };
    fetchContacts();
  }, [toast]);

  const onSubmit = async (data: CampaignFormValues) => {
    setLoading(true);
    try {
      const response = await fetch('/api/marketing/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Falha ao criar a campanha.");
      }
      
      toast({ title: "Sucesso!", description: "Campanha criada com sucesso." });
      router.push('/dashboard/marketing/campanhas');

    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const selectedContactIds = form.watch("contactIds") || [];

  return (
    <div className="space-y-4">
        <Button variant="ghost" asChild className="px-0 hover:bg-transparent">
            <Link href="/dashboard/marketing/campanhas">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
        </Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Nova Campanha de Webhook</CardTitle>
                    <CardDescription>Preencha os detalhes para criar uma nova campanha.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Campanha (Título)</FormLabel>
                                <FormControl><Input placeholder="Ex: Campanha de Lançamento" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Corpo da Mensagem</FormLabel>
                                <FormControl><Textarea rows={8} placeholder="Digite a mensagem que será enviada..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="contactIds"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Destinatários</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn("w-full justify-between", selectedContactIds.length === 0 && "text-muted-foreground")}
                                        disabled={pageLoading}
                                    >
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
                                                ? selectedContactIds.filter((id) => id !== contact.id)
                                                : [...selectedContactIds, contact.id];
                                                field.onChange(newValue);
                                            }}
                                            >
                                            <Check className={cn("mr-2 h-4 w-4", selectedContactIds.includes(contact.id) ? "opacity-100" : "opacity-0")} />
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
                </CardContent>
            </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || pageLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Criar Campanha
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}