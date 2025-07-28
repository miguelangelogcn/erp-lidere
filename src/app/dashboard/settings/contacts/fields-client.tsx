'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, PlusCircle, Edit, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from "@/components/ui/checkbox"

// Schema para validação do formulário
const fieldSchema = z.object({
  label: z.string().min(1, 'O nome do campo é obrigatório.'),
  key: z.string().min(1, 'A chave é obrigatória.').regex(/^[a-zA-Z0-9_]+$/, 'A chave só pode conter letras, números e underscore.'),
  fieldType: z.enum(['text', 'number', 'date', 'select']),
  isRequired: z.boolean().default(false),
});

type Field = z.infer<typeof fieldSchema> & { id: string; order: number };

// Props para tornar o componente reutilizável
interface FieldsClientProps {
  apiPath: string;
  title: string;
  description: string;
}

// Componente da linha que pode ser arrastada
const SortableFieldItem = ({ field, onEdit, onDelete }: { field: Field, onEdit: (field: Field) => void, onDelete: (fieldId: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center p-2 border-b bg-white hover:bg-slate-50">
      <div className="w-1/12 flex justify-center">
        <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab"><GripVertical className="h-5 w-5" /></Button>
      </div>
      <div className="w-4/12 font-medium">{field.label}</div>
      <div className="w-4/12 capitalize">{field.fieldType}</div>
      <div className="w-3/12 text-right space-x-2">
        <Button variant="outline" size="icon" onClick={() => onEdit(field)}><Edit className="h-4 w-4" /></Button>
        <Button variant="destructive" size="icon" onClick={() => onDelete(field.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default function FieldsClient({ apiPath, title, description }: FieldsClientProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof fieldSchema>>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { label: '', key: '', fieldType: 'text', isRequired: false },
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Busca os dados reais da API ao carregar
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(apiPath);
      const data = await response.json();
      setFields(data);
    };
    fetchData();
  }, [apiPath]);

  // Função para salvar (criar ou editar)
  const onSubmit = async (values: z.infer<typeof fieldSchema>) => {
    const url = editingField ? `${apiPath}/${editingField.id}` : apiPath;
    const method = editingField ? 'PUT' : 'POST';

    const order = editingField ? editingField.order : (fields.length + 1);
    const payload = { ...values, order };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const savedField = await response.json();
      if (editingField) {
        setFields(fields.map(f => f.id === editingField.id ? savedField : f));
      } else {
        setFields([...fields, savedField]);
      }
      toast({ title: "Sucesso!", description: `Campo "${values.label}" salvo.` });
      setIsDialogOpen(false);
      setEditingField(null);
    } else {
      toast({ title: "Erro!", description: "Não foi possível salvar o campo.", variant: 'destructive' });
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;

    const response = await fetch(`${apiPath}/${fieldId}`, { method: 'DELETE' });
    if (response.ok) {
      setFields(fields.filter(f => f.id !== fieldId));
      toast({ title: "Campo excluído!" });
    } else {
      toast({ title: "Erro!", description: "Não foi possível excluir o campo.", variant: 'destructive' });
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);
      const reorderedFields = arrayMove(fields, oldIndex, newIndex);
      setFields(reorderedFields);
      // Aqui você chamaria a API para salvar a nova ordem em lote
    }
  };
  
  const openDialogForNew = () => {
      form.reset({ label: '', key: '', fieldType: 'text', isRequired: false });
      setEditingField(null);
      setIsDialogOpen(true);
  }

  const openDialogForEdit = (field: Field) => {
      form.reset(field);
      setEditingField(field);
      setIsDialogOpen(true);
  }

  return (
    <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex justify-end my-4">
            <Button onClick={openDialogForNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo
            </Button>
        </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingField ? 'Editar Campo' : `Adicionar Novo Campo de ${title}`}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="label" render={({ field }) => (
                            <FormItem><FormLabel>Nome do Campo</FormLabel><FormControl><Input placeholder="Ex: Data de Nascimento" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="key" render={({ field }) => (
                            <FormItem><FormLabel>Chave (identificador)</FormLabel><FormControl><Input placeholder="Ex: birth_date" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="fieldType" render={({ field }) => (
                            <FormItem><FormLabel>Tipo de Campo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="text">Texto</SelectItem>
                                        <SelectItem value="number">Número</SelectItem>
                                        <SelectItem value="date">Data</SelectItem>
                                        <SelectItem value="select">Seleção</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="isRequired" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Campo Obrigatório?</FormLabel></FormItem>
                        )}/>
                        <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
      </Dialog>
      
      <div className="border rounded-md bg-slate-50">
        <div className="flex items-center p-2 border-b font-medium text-sm text-muted-foreground">
            <div className="w-1/12"></div>
            <div className="w-4/12">Nome do Campo</div>
            <div className="w-4/12">Tipo</div>
            <div className="w-3/12 text-right pr-4">Ações</div>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                {fields.map(field => (
                  <SortableFieldItem key={field.id} field={field} onEdit={openDialogForEdit} onDelete={handleDelete} />
                ))}
            </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
