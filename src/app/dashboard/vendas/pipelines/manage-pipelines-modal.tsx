"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash, Edit, X } from "lucide-react";
import {
  Pipeline
} from "@/lib/firebase/firestore-types";
import {
  getPipelines,
  addPipeline,
  updatePipeline,
  deletePipeline,
} from "@/lib/firebase/firestore-client";
import { ScrollArea } from "@/components/ui/scroll-area";

const pipelineFormSchema = z.object({
  name: z.string().min(1, "O nome do pipeline é obrigatório."),
  stages: z.array(z.object({ value: z.string().min(1, "O nome do estágio é obrigatório.") })),
});

type PipelineFormValues = z.infer<typeof pipelineFormSchema>;

interface ManagePipelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPipelinesUpdated: (pipelines: Pipeline[]) => void;
}

export function ManagePipelinesModal({ isOpen, onClose, onPipelinesUpdated }: ManagePipelinesModalProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineFormSchema),
    defaultValues: {
      name: "",
      stages: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stages",
  });

  const refreshPipelines = async () => {
    setLoading(true);
    const data = await getPipelines();
    setPipelines(data);
    onPipelinesUpdated(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshPipelines();
    }
  }, [isOpen]);

  const handleSelectPipeline = (pipeline: Pipeline | null) => {
    setSelectedPipeline(pipeline);
    if (pipeline) {
      form.reset({
        name: pipeline.name,
        stages: pipeline.stages.map((stage) => ({ value: stage })),
      });
    } else {
      form.reset({
        name: "",
        stages: [{ value: "Lead" }, {value: "Contato Feito"}, {value: "Proposta Enviada"}],
      });
    }
  };

  const onSubmit = async (values: PipelineFormValues) => {
    setLoading(true);
    const pipelineData = {
      name: values.name,
      stages: values.stages.map(s => s.value),
    };
    try {
      if (selectedPipeline) {
        await updatePipeline(selectedPipeline.id, pipelineData);
        toast({ title: "Sucesso", description: "Pipeline atualizado." });
      } else {
        await addPipeline(pipelineData);
        toast({ title: "Sucesso", description: "Pipeline criado." });
      }
      await refreshPipelines();
      handleSelectPipeline(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedPipeline) return;
    setLoading(true);
    try {
      await deletePipeline(selectedPipeline.id);
      toast({ title: "Sucesso", description: "Pipeline excluído." });
      await refreshPipelines();
      handleSelectPipeline(null);
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o pipeline." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl grid-cols-3">
        <div className="col-span-1 border-r pr-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pipelines</h3>
            <Button size="sm" onClick={() => handleSelectPipeline(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo
            </Button>
          </div>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {pipelines.map((p) => (
                <div
                  key={p.id}
                  className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${
                    selectedPipeline?.id === p.id ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelectPipeline(p)}
                >
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="col-span-2 pl-6">
          <DialogHeader>
            <DialogTitle>{selectedPipeline ? "Editar Pipeline" : "Novo Pipeline"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem><FormLabel>Nome do Pipeline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <div>
                <FormLabel>Estágios (Colunas)</FormLabel>
                <ScrollArea className="h-64 mt-2">
                <div className="space-y-2 pr-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`stages.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-grow"><FormControl><Input placeholder={`Estágio ${index + 1}`} {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                </ScrollArea>
                <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => append({ value: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Estágio
                </Button>
              </div>

              <DialogFooter>
                {selectedPipeline && (
                  <Button type="button" variant="destructive" onClick={() => setIsDeleteAlertOpen(true)} disabled={loading}>
                    <Trash className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                )}
                <div className="flex-grow"></div>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>Essa ação não pode ser desfeita. Todas as negociações neste pipeline serão perdidas.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteConfirm} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Exclusão
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
