'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ImportStep = 'selectFile' | 'mapFields' | 'importing';
type CustomField = {
  id: string;
  key: string;
  label: string;
};

export function ContactImporter() {
  const [step, setStep] = useState<ImportStep>('selectFile');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const { toast } = useToast();

  // Busca os campos customizáveis ao carregar o componente
  useEffect(() => {
    async function fetchCustomFields() {
      try {
        const response = await fetch('/api/settings/contact-fields');
        if (!response.ok) throw new Error('Falha ao buscar campos customizáveis');
        const customFields: CustomField[] = await response.json();
        
        // Monta a lista final de campos para o dropdown
        const systemFields = [
          { value: 'ignore', label: 'Ignorar esta coluna' },
          { value: 'name', label: 'Nome do Contato (Padrão)' },
          { value: 'email', label: 'Email (Padrão)' },
          { value: 'phone', label: 'Telefone (Padrão)' },
        ];
        
        const customFieldOptions = customFields.map(field => ({
          value: `customData.${field.key}`, // Prefixo para identificar campos customizáveis
          label: `${field.label} (Customizável)`,
        }));

        setAvailableFields([...systemFields, ...customFieldOptions]);

      } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      }
    }
    fetchCustomFields();
  }, [toast]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/contacts/parse-headers', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      setHeaders(result.headers);
      
      // Lógica de pré-mapeamento inicial
      const initialMapping: { [key: string]: string } = {};
      result.headers.forEach((h: string) => {
        initialMapping[h] = 'ignore';
      });
      setMapping(initialMapping);
      setStep('mapFields');

    } catch (error: any) {
      toast({ title: 'Erro ao ler arquivo', description: error.message, variant: 'destructive' });
    }
  };

  const handleMappingChange = (csvHeader: string, systemField: string) => {
    setMapping(prev => ({ ...prev, [csvHeader]: systemField }));
  };

  const handleFinalImport = async () => {
    if (!file) return;

    setStep('importing');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    try {
        const response = await fetch('/api/contacts/import', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        toast({ title: 'Sucesso!', description: `${result.count} contatos foram importados.` });
        window.location.reload();
    } catch (error: any) {
        toast({ title: 'Erro na importação', description: error.message, variant: 'destructive' });
    } finally {
        reset();
    }
  };

  const reset = () => {
    setStep('selectFile');
    setFile(null);
    setHeaders([]);
    setMapping({});
  };

  return (
    <>
      <label htmlFor="file-upload" className="cursor-pointer">
        <Button asChild>
            <span>Importar Contatos</span>
        </Button>
      </label>
      <Input id="file-upload" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />

      <Dialog open={step === 'mapFields' || step === 'importing'} onOpenChange={reset}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Mapear Colunas para Importação</DialogTitle></DialogHeader>
          <p>Associe as colunas do seu arquivo CSV aos campos correspondentes no sistema.</p>
          <Table>
            <TableHeader><TableRow><TableHead>Coluna no Arquivo</TableHead><TableHead>Campo no Sistema</TableHead></TableRow></TableHeader>
            <TableBody>
              {headers.map(header => (
                <TableRow key={header}>
                  <TableCell className="font-medium">{header}</TableCell>
                  <TableCell>
                    <Select value={mapping[header] || 'ignore'} onValueChange={value => handleMappingChange(header, value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableFields.map(field => (
                          <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={reset} disabled={step === 'importing'}>Cancelar</Button>
            <Button onClick={handleFinalImport} disabled={step === 'importing'}>
              {step === 'importing' ? 'Importando...' : 'Confirmar e Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
