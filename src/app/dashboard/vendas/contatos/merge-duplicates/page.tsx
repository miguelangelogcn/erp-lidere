
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

interface DuplicateContactInfo {
  id: string;
  name: string;
  email: string;
}

interface DuplicateReport {
  id: string; // email
  duplicateCount: number;
  contacts: DuplicateContactInfo[];
  primaryContactId: string;
}

export default function MergeDuplicatesPage() {
  const [reports, setReports] = useState<DuplicateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergingId, setMergingId] = useState<string | null>(null);
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

  const handleMergeGroup = async (reportId: string) => {
    setMergingId(reportId);
    try {
        const response = await fetch('/api/contacts/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportId }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "A mesclagem falhou.");
        }
        
        toast({ title: "Sucesso!", description: result.message });

        // Remove o card da tela
        setReports(prev => prev.filter(r => r.id !== reportId));

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro na Mesclagem', description: error.message });
    } finally {
        setMergingId(null);
    }
  };

  return (
    <div className="space-y-6">
       <Link href="/dashboard/vendas/contatos" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
         <ArrowLeft className="mr-2 h-4 w-4" />
         Voltar para Contatos
       </Link>
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Mesclar Contatos Duplicados</h1>
        <p className="text-muted-foreground">Revise os grupos de contatos com o mesmo e-mail e mescle-os para manter sua base limpa.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{report.id}</CardTitle>
                <CardDescription>{report.duplicateCount} contatos encontrados</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {report.contacts.map(contact => (
                    <li key={contact.id} className={contact.id === report.primaryContactId ? 'font-bold' : ''}>
                      {contact.name} {contact.id === report.primaryContactId && '(Principal)'}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleMergeGroup(report.id)}
                    disabled={mergingId === report.id}
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
