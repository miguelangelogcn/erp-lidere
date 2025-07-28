'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from "@/components/ui/checkbox"

const fieldSchema = z.object({
  label: z.string().min(1, 'O nome do campo é obrigatório.'),
  key: z.string().min(1, 'A chave é obrigatória.').regex(/^[a-zA-Z0-9_]+$/, 'A chave só pode conter letras, números e underscore.'),
  fieldType: z.enum(['text', 'number', 'date', 'url', 'email']),
  required: z.boolean().default(false),
})

export type CustomField = z.infer<typeof fieldSchema> & { id: string; order: number }

// Componente para a "Linha" da nossa lista que parece uma tabela
const SortableFieldItem = ({ field }: { field: CustomField }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center p-2 border-b bg-white">
      <div className="w-1/12">
        <Button variant="ghost" size="sm" {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-4/12 font-medium">{field.label}</div>
      <div className="w-4/12">{field.fieldType}</div>
      <div className="w-3/12 text-right">
        <Button variant="outline" size="sm">Editar</Button>
        <Button variant="destructive" size="sm" className="ml-2">Excluir</Button>
      </div>
    </div>
  )
}

export function FieldsClient() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const form = useForm<z.infer<typeof fieldSchema>>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { label: '', key: '', fieldType: 'text', required: false },
  })

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useEffect(() => {
    async function fetchFields() {
        try {
            const response = await fetch('/api/settings/employee-fields');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setFields(data);
        } catch (error) {
            toast({ title: "Erro ao buscar campos", description: "Não foi possível carregar a lista de campos.", variant: 'destructive'})
        }
    }
    fetchFields();
  }, [toast])

  const onSubmit = (values: z.infer<typeof fieldSchema>) => {
    toast({ title: "Campo Salvo!", description: "O novo campo foi adicionado com sucesso." })
    setOpen(false)
    form.reset()
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Adicionar Campo</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Campo de Funcionário</DialogTitle>
                    <DialogDescription>Defina as propriedades para o cadastro de funcionários.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="label" render={({ field }) => (
                            <FormItem><FormLabel>Nome do Campo</FormLabel><FormControl><Input placeholder="Ex: Cargo na Empresa" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="key" render={({ field }) => (
                            <FormItem><FormLabel>Chave (identificador)</FormLabel><FormControl><Input placeholder="Ex: company_role" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="fieldType" render={({ field }) => (
                            <FormItem><FormLabel>Tipo de Campo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="text">Texto</SelectItem>
                                        <SelectItem value="number">Número</SelectItem>
                                        <SelectItem value="date">Data</SelectItem>
                                        <SelectItem value="url">URL</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="required" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Campo Obrigatório?</FormLabel></FormItem>
                        )}/>
                        <DialogFooter><Button type="submit">Salvar Campo</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      {/* --- Estrutura da Tabela com DIVs --- */}
      <div className="border rounded-md">
        {/* Cabeçalho */}
        <div className="flex items-center p-2 border-b bg-slate-50 font-medium">
            <div className="w-1/12"></div>
            <div className="w-4/12">Nome do Campo</div>
            <div className="w-4/12">Tipo</div>
            <div className="w-3/12 text-right">Ações</div>
        </div>
        {/* Corpo Ordenável */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                {fields.map(field => (
                  <SortableFieldItem key={field.id} field={field} />
                ))}
            </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
