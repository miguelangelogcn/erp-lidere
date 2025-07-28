'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, escolha um arquivo CSV para importar.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha no servidor');
      }
      
      toast({
        title: 'Sucesso!',
        description: `${result.count} contatos foram importados.`,
      });
      // Opcional: Chamar uma função para recarregar a lista de contatos na página
      window.location.reload(); 

    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message || 'Não foi possível importar os contatos.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setFile(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={isImporting}
        className="max-w-xs"
      />
      <Button onClick={handleImport} disabled={!file || isImporting}>
        {isImporting ? 'Importando...' : 'Importar'}
      </Button>
    </div>
  );
}
