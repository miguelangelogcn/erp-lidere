
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Contact, Product, getProducts, getStudentsFromContacts, createFollowUp } from "@/lib/firebase/firestore";

const formSchema = z.object({
  studentId: z.string().min(1, "O aluno é obrigatório."),
  productId: z.string().min(1, "O produto é obrigatório."),
});
type FormValues = z.infer<typeof formSchema>;

interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFollowUpCreated: () => void;
}

export function AddFollowUpModal({ isOpen, onClose, onFollowUpCreated }: AddFollowUpModalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        const fetchData = async () => {
            try {
                const [studentsData, productsData] = await Promise.all([
                    getStudentsFromContacts(),
                    getProducts()
                ]);
                setStudents(studentsData);
                setProducts(productsData);
            } catch (error) {
                toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados para o formulário." });
            }
        };
        fetchData();
    }
  }, [isOpen, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const student = students.find(s => s.userId === values.studentId);
      const product = products.find(p => p.id === values.productId);

      if (!student || !product || !student.userId) {
        throw new Error("Aluno ou produto selecionado é inválido.");
      }
      
      await createFollowUp({
          studentUserId: student.userId,
          contactName: student.name,
          productId: product.id,
          productName: product.name,
      });

      toast({ title: "Sucesso", description: "Acompanhamento criado." });
      onFollowUpCreated();
      onClose();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível criar o acompanhamento." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Acompanhamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField 
                control={form.control} 
                name="studentId" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Aluno</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecione um aluno"/></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {students.map(s => (<SelectItem key={s.id} value={s.userId!}>{s.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField 
                control={form.control} 
                name="productId" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecione um produto"/></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
