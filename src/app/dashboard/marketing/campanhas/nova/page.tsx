"use client";

import { useState } from "react";
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
import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { addCampaign } from "@/lib/firebase/firestore";

const campaignFormSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório."),
  subject: z.string().min(1, "O assunto do e-mail é obrigatório."),
  body: z.string().min(1, "O corpo do e-mail é obrigatório."),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function NovaCampanhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: { name: "", subject: "", body: "" },
  });

  const onSubmit = async (values: CampaignFormValues) => {
    setLoading(true);
    try {
      await addCampaign({
        name: values.name,
        status: 'draft',
        channels: ['email'], // Por enquanto, apenas e-mail
        contactIds: [], // Será definido em um passo futuro
        emailContent: {
          subject: values.subject,
          body: values.body,
        },
      });
      toast({ title: "Sucesso!", description: "Campanha salva como rascunho." });
      router.push("/dashboard/marketing/campanhas");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a campanha." });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Nova Campanha</h1>
        <p className="text-muted-foreground">Crie o conteúdo da sua campanha de e-mail.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Campanha</CardTitle>
              <CardDescription>Defina os detalhes e o conteúdo que será enviado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome da Campanha</FormLabel><FormControl><Input placeholder="Ex: Lançamento de Natal" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Assunto do E-mail</FormLabel><FormControl><Input placeholder="O título que seus contatos verão" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="body" render={({ field }) => (
                  <FormItem><FormLabel>Corpo do E-mail</FormLabel><FormControl><Textarea rows={15} placeholder="Escreva a sua mensagem aqui..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </CardContent>
          </Card>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" asChild>
                <Link href="/dashboard/marketing/campanhas">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Rascunho
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
