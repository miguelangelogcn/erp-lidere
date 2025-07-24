// src/app/dashboard/marketing/campanhas/nova/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { getContacts } from "@/lib/firebase/firestore";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

interface CampaignFormValues {
  name: string;
  contactIds: string[];
  channels: string | string[]; // O formulário pode enviar um ou outro
  emailSubject: string;
  emailBody: string;
}

export default function NovaCampanhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, control, watch } = useForm<CampaignFormValues>({
    defaultValues: {
      channels: [],
    },
  });

  const selectedChannels = watch("channels") || [];

  useEffect(() => {
    async function loadContacts() {
      const contactsData = await getContacts();
      setContacts(contactsData.map(c => ({ value: c.id, label: `${c.name} (${c.email})` })));
    }
    loadContacts();
  }, []);

  const onSubmit = async (data: CampaignFormValues) => {
    setLoading(true);

    // ===============================================
    // CORREÇÃO FINAL APLICADA AQUI
    // ===============================================
    const channelsAsArray = Array.isArray(data.channels) ? data.channels : (data.channels ? [data.channels] : []);
    const emailIsSelected = channelsAsArray.includes('email');

    const payload = {
      name: data.name,
      contactIds: data.contactIds || [],
      channels: channelsAsArray,
      emailContent: emailIsSelected ? {
        subject: data.emailSubject,
        body: data.emailBody,
      } : null, // Salva como null se não for selecionado
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        {/* ... (código do formulário permanece o mesmo) ... */}
        <div>
          <label>Nome da Campanha</label>
          <Input {...register("name", { required: true })} />
        </div>
        <div>
          <label>Contatos</label>
          <Controller
            control={control}
            name="contactIds"
            render={({ field }) => (
              <MultiSelect
                options={contacts}
                onValueChange={field.onChange}
                defaultValue={field.value}
                placeholder="Selecione os contatos..."
              />
            )}
          />
        </div>
        <div>
          <label>Canais</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <Checkbox value="email" {...register("channels")} />
              <span className="ml-2">E-mail</span>
            </label>
            <label className="flex items-center text-gray-400">
              <Checkbox disabled />
              <span className="ml-2">WhatsApp (em breve)</span>
            </label>
          </div>
        </div>

        {selectedChannels.includes("email") && (
          <div className="border p-4 rounded-md space-y-4">
            <h2 className="font-semibold">Conteúdo do E-mail</h2>
            <div>
              <label>Assunto</label>
              <Input {...register("emailSubject")} />
            </div>
            <div>
              <label>Corpo da Mensagem</label>
              <Textarea {...register("emailBody")} rows={8} />
            </div>
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Campanha
        </Button>
      </form>
    </div>
  );
}