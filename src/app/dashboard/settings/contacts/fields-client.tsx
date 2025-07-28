
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash, Loader2, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Types
export interface CustomField {
    id: string;
    label: string;
    key: string;
    fieldType: "text" | "number" | "date" | "url" | "email";
    order: number;
    required: boolean;
}

const formSchema = z.object({
    label: z.string().min(1, "O rótulo é obrigatório."),
    key: z.string().min(1, "A chave é obrigatória.").regex(/^[a-zA-Z0-9_]+$/, "A chave deve conter apenas letras, números e underscores."),
    fieldType: z.enum(["text", "number", "date", "url", "email"]),
    required: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

const fieldTypeOptions = [
    { value: "text", label: "Texto Curto" },
    { value: "number", label: "Número" },
    { value: "date", label: "Data" },
    { value: "url", label: "URL" },
    { value: "email", label: "Email" },
];

// Main Client Component
export function FieldsClient() {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedField, setSelectedField] = useState<CustomField | null>(null);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { label: "", key: "", fieldType: "text", required: false },
    });
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const refreshData = async () => {
        setPageLoading(true);
        try {
            const response = await fetch('/api/settings/contact-fields');
            if (!response.ok) throw new Error("Falha ao buscar dados.");
            const data = await response.json();
            setFields(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleDialogOpen = (field: CustomField | null) => {
        setSelectedField(field);
        if (field) {
            form.reset(field);
        } else {
            const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.order)) + 1 : 0;
            form.reset({ label: "", key: "", fieldType: "text", required: false });
        }
        setIsFormOpen(true);
    };

    const handleDeleteAlertOpen = (field: CustomField) => {
        setSelectedField(field);
        setIsDeleteAlertOpen(true);
    };

    const onSubmit = async (values: FormValues) => {
        setActionLoading(true);
        const url = selectedField 
            ? `/api/settings/contact-fields/${selectedField.id}`
            : '/api/settings/contact-fields';
        const method = selectedField ? 'PUT' : 'POST';

        const order = selectedField?.order ?? (fields.length > 0 ? Math.max(...fields.map(f => f.order)) + 1 : 0);
        const payload = { ...values, order };
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao salvar o campo.');
            }
            toast({ title: "Sucesso", description: `Campo ${selectedField ? 'atualizado' : 'criado'}.` });
            await refreshData();
            setIsFormOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
        } finally {
            setActionLoading(false);
        }
    };
    
    const onDeleteConfirm = async () => {
        if (!selectedField) return;
        setActionLoading(true);
        try {
            const response = await fetch(`/api/settings/contact-fields/${selectedField.id}`, { method: 'DELETE' });
             if (!response.ok) throw new Error('Falha ao excluir o campo.');
            toast({ title: "Sucesso", description: "Campo excluído." });
            await refreshData();
            setIsDeleteAlertOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            const newOrder = arrayMove(fields, oldIndex, newIndex);
            setFields(newOrder); // Optimistic update

            const updatePromises = newOrder.map((field, index) =>
                fetch(`/api/settings/contact-fields/${field.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order: index }),
                })
            );

            try {
                await Promise.all(updatePromises);
                toast({ title: "Sucesso", description: "Ordem dos campos atualizada." });
                await refreshData();
            } catch (error) {
                 toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a nova ordem." });
                 await refreshData();
            }
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => handleDialogOpen(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Campo
                </Button>
            </div>
            {pageLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Ordem</TableHead>
                            <TableHead>Nome do Campo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Obrigatório</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                                {fields.map((field) => (
                                    <SortableRow key={field.id} field={field} onEdit={handleDialogOpen} onDelete={handleDeleteAlertOpen} />
                                ))}
                            </TableBody>
                        </SortableContext>
                    </DndContext>
                </Table>
                </div>
            )}

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                <DialogHeader><DialogTitle>{selectedField ? "Editar Campo" : "Novo Campo"}</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                         <FormField control={form.control} name="label" render={({ field }) => (
                            <FormItem><FormLabel>Nome do Campo (Rótulo)</FormLabel><FormControl><Input placeholder="Ex: Data de Nascimento" {...field} /></FormControl><FormMessage /></FormItem>
                         )}/>
                         <FormField control={form.control} name="key" render={({ field }) => (
                            <FormItem><FormLabel>Chave (Identificador)</FormLabel><FormControl><Input placeholder="Ex: data_nascimento" {...field} disabled={!!selectedField} /></FormControl><FormMessage /></FormItem>
                         )}/>
                         <FormField control={form.control} name="fieldType" render={({ field }) => (
                           <FormItem><FormLabel>Tipo de Campo</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                               <SelectContent>{fieldTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                             </Select><FormMessage />
                           </FormItem>
                         )}/>
                         <FormField control={form.control} name="required" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel className="font-normal">Este campo é obrigatório?</FormLabel></FormItem>
                        )}/>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={actionLoading}>{actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
                        </DialogFooter>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o campo.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteConfirm} disabled={actionLoading}>{actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function SortableRow({ field, onEdit, onDelete }: { field: CustomField; onEdit: (field: CustomField) => void; onDelete: (field: CustomField) => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell>
                <div {...listeners} {...attributes} className="cursor-grab p-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
            </TableCell>
            <TableCell>{field.order}</TableCell>
            <TableCell className="font-medium">{field.label}</TableCell>
            <TableCell>{fieldTypeOptions.find(o => o.value === field.fieldType)?.label}</TableCell>
            <TableCell>{field.required ? "Sim" : "Não"}</TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(field)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(field)}><Trash className="h-4 w-4 text-destructive" /></Button>
            </TableCell>
        </TableRow>
    );
}
