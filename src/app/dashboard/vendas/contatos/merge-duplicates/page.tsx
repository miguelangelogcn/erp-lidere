
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowLeft, Loader2, Trash } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DuplicateContactInfo {
  id: string;
  name: string;
  email: string;
}

interface DuplicateReport {
  id: string; // email
  type: 'email' | 'phone';
  key: string;
  duplicateCount: number;
  contacts: DuplicateContactInfo[];
  primaryContactId: string;
}

export default function MergeDuplicatesPage() {
  const [reports, setReports] = useState<DuplicateReport[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [isBulkMerging, setIsBulkMerging] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contacts/duplicates-report');
      if (!response.ok) throw new Error('Falha ao buscar duplicatas');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedReports(reports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectOne = (checked: boolean | string, reportId: string) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleMerge = async (reportIds: string[], isBulk: boolean) => {
      const stateSetter = isBulk ? setIsBulkMerging : setMergingId;
      const endpoint = isBulk ? '/api/contacts/bulk-merge' : '/api/contacts/merge';
      const body = isBulk ? { reportIds } : { reportId: reportIds[0] };
      const idOrIds = isBulk ? reportIds : reportIds[0];

      stateSetter(isBulk ? true : idOrIds);

      try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "A mesclagem falhou.");
        }
        
        toast({ title: "Sucesso!", description: result.message });

        setReports(prev => prev.filter(r => !reportIds.includes(r.id)));
        setSelectedReports(prev => prev.filter(id => !reportIds.includes(id)));

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro na Mesclagem', description: error.message });
    } finally {
        stateSetter(isBulk ? false : null);
    }
  }

  const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        const contactIdsToDelete = reports
            .filter(r => selectedReports.includes(r.id))
            .flatMap(r => r.contacts.map(c => c.id));
        
        // Remove duplicates from the list of IDs
        const uniqueContactIds = [...new Set(contactIdsToDelete)];
        
        try {
            const response = await fetch('/api/contacts/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactIds: uniqueContactIds }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'A exclusão falhou.');
            
            toast({ title: 'Sucesso!', description: `${result.count} contatos excluídos.`});
            
            // Remove the reports from view and clear selection
            setReports(prev => prev.filter(r => !selectedReports.includes(r.id)));
            setSelectedReports([]);

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Erro ao Excluir', description: error.message });
        } finally {
            setIsBulkDeleting(false);
        }
    }


  return (
    <div className="space-y-6">
       <Link href="/dashboard/vendas/contatos" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
         <ArrowLeft className="mr-2 h-4 w-4" />
         Voltar para Contatos
       </Link>
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Mesclar Contatos Duplicados</h1>
        <p className="text-muted-foreground">Revise os grupos de contatos com o mesmo e-mail ou telefone e mescle-os para manter sua base limpa.</p>
      </div>

        {reports.length > 0 && !loading && (
             <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="select-all"
                            checked={selectedReports.length === reports.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">Selecionar Todos</label>
                    </div>
                    <div>
                         <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={selectedReports.length === 0 || isBulkDeleting || isBulkMerging}
                            className="mr-2"
                         >
                            {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                            Excluir Contatos
                        </Button>
                        <Button
                            onClick={() => handleMerge(selectedReports, true)}
                            disabled={selectedReports.length === 0 || isBulkMerging || isBulkDeleting}
                        >
                            {isBulkMerging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Mesclar Selecionados ({selectedReports.length})
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-4">
                    <Checkbox
                        className="mt-1"
                        checked={selectedReports.includes(report.id)}
                        onCheckedChange={(checked) => handleSelectOne(checked, report.id)}
                    />
                    <div className="flex-grow">
                        <CardTitle className="truncate text-base">{report.key}</CardTitle>
                        <CardDescription>
                            {report.duplicateCount} contatos encontrados por {report.type === 'email' ? 'e-mail' : 'telefone'}
                        </CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {report.contacts.map(contact => (
                    <li key={contact.id} className={contact.id === report.primaryContactId ? 'font-bold' : ''}>
                      {contact.name || 'Sem nome'} ({contact.email})
                      {contact.id === report.primaryContactId && ' (Principal)'}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => handleMerge([report.id], false)}
                    disabled={mergingId === report.id || isBulkMerging}
                  >
                    {mergingId === report.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mergingId === report.id ? 'Mesclando...' : 'Mesclar este grupo'}
                  </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
             <div className="mx-auto bg-green-100 rounded-full h-12 w-12 flex items-center justify-center">
                 <AlertTriangle className="h-6 w-6 text-green-700" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Nenhuma duplicata encontrada!</h3>
            <p className="text-muted-foreground mt-1">Sua base de contatos está limpa no momento.</p>
        </div>
      )}
    </div>
  );
}

