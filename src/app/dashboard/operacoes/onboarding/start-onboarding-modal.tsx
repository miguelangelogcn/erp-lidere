"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Contact, Product, startOnboarding } from "@/lib/firebase/firestore";

const formSchema = z.object({
  contactId: z.string().min(1, "O contato é obrigatório."),
  productId: z.string().min(1, "O produto é obrigatório."),
});
type FormValues = z.infer<typeof formSchema>;

interface StartOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  products: Product[];
  onOnboardingStarted: () => void;
}

export function StartOnboardingModal({ isOpen, onClose, contacts, products, onOnboardingStarted }: StartOnboardingModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { contactId: "", productId: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const contact = contacts.find(c => c.id === values.contactId);
      const product = products.find(p => p.id === values.productId);
      if (!contact || !product) throw new Error("Contato ou produto não encontrado.");

      await startOnboarding(contact, product);
      toast({ title: "Sucesso", description: "Onboarding iniciado." });
      onOnboardingStarted();
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível iniciar o onboarding." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Novo Onboarding</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="contactId" render={({ field }) => (<FormItem><FormLabel>Contato</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um contato"/></SelectTrigger></FormControl><SelectContent>{contacts.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="productId" render={({ field }) => (<FormItem><FormLabel>Produto</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um produto"/></SelectTrigger></FormControl><SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Iniciar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
