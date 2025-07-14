"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash, MoreHorizontal, Loader2, X } from "lucide-react";

import { Product, addProduct, updateProduct, deleteProduct, getProducts } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  value: z.coerce.number().min(0, "O valor deve ser positivo."),
  onboardingPlan: z.object({
    D0: z.array(z.object({ text: z.string().min(1) })),
    D1: z.array(z.object({ text: z.string().min(1) })),
    D2: z.array(z.object({ text: z.string().min(1) })),
    D3: z.array(z.object({ text: z.string().min(1) })),
    D4: z.array(z.object({ text: z.string().min(1) })),
    D5: z.array(z.object({ text: z.string().min(1) })),
    D6: z.array(z.object({ text: z.string().min(1) })),
    D7: z.array(z.object({ text: z.string().min(1) })),
  }),
});

type ProductFormValues = z.infer<typeof formSchema>;

const emptyPlan = {
  D0: [], D1: [], D2: [], D3: [], D4: [], D5: [], D6: [], D7: [],
}

export function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", value: 0, onboardingPlan: emptyPlan },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "onboardingPlan.D0", // Example, will be managed dynamically
  });
  
  const days = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"] as const;

  const refreshData = async () => {
    try {
        if (!user) return;
        setPageLoading(true);
        const data = await getProducts();
        setProducts(data);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os produtos." });
    } finally {
        setPageLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, [user]);

  const handleDialogOpen = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      const plan = { ...emptyPlan };
      for(const day of days) {
        plan[day] = product.onboardingPlan[day]?.map(text => ({ text })) || [];
      }
      form.reset({ ...product, onboardingPlan: plan });
    } else {
      form.reset({ name: "", value: 0, onboardingPlan: emptyPlan });
    }
    setIsFormOpen(true);
  };

  const handleDeleteAlertOpen = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteAlertOpen(true);
  }

  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    const finalPlan: Product['onboardingPlan'] = {};
    for (const day of days) {
      finalPlan[day] = values.onboardingPlan[day].map(item => item.text);
    }
    const productData = { ...values, onboardingPlan: finalPlan };

    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, productData);
        toast({ title: "Sucesso", description: "Produto atualizado." });
      } else {
        await addProduct(productData);
        toast({ title: "Sucesso", description: "Produto adicionado." });
      }
      await refreshData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
        await deleteProduct(selectedProduct.id);
        toast({ title: "Sucesso", description: "Produto excluído." });
        await refreshData();
        setIsDeleteAlertOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o produto." });
    } finally {
        setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="flex justify-end">
            <Button onClick={() => handleDialogOpen(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Produto
            </Button>
        </div>
        <DialogContent className="max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{selectedProduct ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[70vh] p-1">
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome do Produto" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="value" render={({ field }) => ( <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" placeholder="1000.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Plano de Onboarding</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {days.map((day) => (
                           <OnboardingDayField key={day} control={form.control} day={day} />
                        ))}
                    </div>
                </div>
              </div>
              </ScrollArea>
              <DialogFooter className="mt-4 p-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continuar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader><CardTitle>Lista de Produtos</CardTitle></CardHeader>
        <CardContent>
           {pageLoading ? (
            <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
           ) : (
            <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Valor</TableHead><TableHead className="w-[100px] text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{formatCurrency(product.value)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDialogOpen(product)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAlertOpen(product)} className="text-destructive focus:text-destructive"><Trash className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </>
  );
}


function OnboardingDayField({ control, day }: { control: any, day: `D${number}` }) {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `onboardingPlan.${day}`,
    });
  
    return (
      <div className="space-y-2 p-3 border rounded-lg">
        <FormLabel className="font-semibold">{day}</FormLabel>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormField
              control={control}
              name={`onboardingPlan.${day}.${index}.text`}
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder={`Tarefa ${index + 1}`} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="w-full mt-2" onClick={() => append({ text: "" })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa
        </Button>
      </div>
    );
  }
