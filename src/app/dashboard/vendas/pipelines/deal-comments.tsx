
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: any;
}

interface DealCommentsProps {
  dealId: string;
}

export function DealComments({ dealId }: DealCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchComments() {
      if (!dealId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/deals/${dealId}/comments`);
        if (!response.ok) throw new Error("Não foi possível buscar os comentários");
        const data = await response.json();
        setComments(data);
      } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchComments();
  }, [dealId, toast]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/deals/${dealId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });

      if (!response.ok) throw new Error('Falha ao salvar comentário');

      const savedComment = await response.json();
      
      // Convert server timestamp to a usable Date object on the client-side
      const displayComment = {
        ...savedComment,
        createdAt: new Date() // Use current date for immediate display
      };

      setComments([displayComment, ...comments]);
      setNewComment('');
      toast({ title: 'Comentário adicionado!' });

    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Adicione uma nota sobre esta negociação..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isLoading}
          rows={4}
        />
        <Button onClick={handleSubmitComment} disabled={isLoading || !newComment.trim()}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          Adicionar Comentário
        </Button>
      </div>

       <ScrollArea className="h-64">
            <div className="space-y-4 pr-4">
                {comments.map((comment) => (
                    <div key={comment.id} className="text-sm p-3 bg-muted/50 rounded-md">
                        <p className="whitespace-pre-wrap">{comment.text}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                           {comment.author} - {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString('pt-BR') : 'Agora mesmo'}
                        </p>
                    </div>
                ))}
                {comments.length === 0 && !isLoading && <p className="text-sm text-center text-muted-foreground pt-4">Nenhuma nota adicionada.</p>}
            </div>
        </ScrollArea>
    </div>
  );
}
