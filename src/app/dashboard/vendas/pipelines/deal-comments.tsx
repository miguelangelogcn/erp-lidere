'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Comment {
  id: string;
  text: string;
  createdAt?: { toDate: () => Date };
}

interface DealCommentsProps {
  dealId: string;
}

export function DealComments({ dealId }: DealCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/deals/${dealId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        } else {
          throw new Error('Falha ao buscar comentários');
        }
      } catch (error) {
        toast({ title: 'Erro', description: 'Não foi possível carregar os comentários.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    if (dealId) {
        fetchComments();
    }
  }, [dealId, toast]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/deals/${dealId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });

      if (!response.ok) throw new Error('Falha ao salvar comentário');

      const savedComment = await response.json();
      // O timestamp do servidor pode não vir como um objeto Date, então normalizamos
      const newCommentData = {
        ...savedComment,
        createdAt: { toDate: () => new Date() }
      }
      setComments([newCommentData, ...comments]);
      setNewComment('');
      toast({ title: 'Comentário adicionado!' });

    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Adicione uma nota sobre esta negociação..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting}
        />
        <Button onClick={handleSubmitComment} disabled={isSubmitting}>
          {isSubmitting ? 'Adicionando...' : 'Adicionar Comentário'}
        </Button>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-slate-50 rounded-md border text-sm">
              <p className="text-gray-800 whitespace-pre-wrap">{comment.text}</p>
              {comment.createdAt && (
                <p className="text-xs text-gray-500 mt-2">
                  {typeof comment.createdAt.toDate === 'function' 
                    ? new Date(comment.createdAt.toDate()).toLocaleString()
                    : 'Enviando...'}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
