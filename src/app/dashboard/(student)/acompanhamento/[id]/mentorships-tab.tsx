
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Paperclip } from 'lucide-react';
import { Mentorship, getMentorships } from '@/lib/firebase/firestore';

export function StudentMentorshipsTab({ followUpId }: { followUpId: string }) {
    const [mentorships, setMentorships] = useState<Mentorship[]>([]);

    useEffect(() => {
        const unsubscribe = getMentorships(followUpId, setMentorships);
        return () => unsubscribe();
    }, [followUpId]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mentorias</CardTitle>
                <CardDescription>Histórico de vídeos e registros das sessões de mentoria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {mentorships.map(m => (
                    <div key={m.id} className="p-4 border rounded-lg">
                        <video src={m.videoUrl} controls className="w-full rounded-md mb-2"></video>
                        <p className="text-sm text-muted-foreground mb-2">
                           Registrado em: {m.createdAt ? format(m.createdAt, 'dd/MM/yyyy HH:mm') : '...'}
                        </p>
                        <p className="whitespace-pre-wrap">{m.transcript}</p>
                        {m.attachments.length > 0 && (
                            <div className='mt-4'>
                                <h4 className='font-semibold'>Anexos:</h4>
                                <ul className='list-disc list-inside'>
                                    {m.attachments.map(att => (
                                        <li key={att.url}>
                                            <a href={att.url} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
                                                <Paperclip className='inline-block mr-1 h-4 w-4'/>{att.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
                {mentorships.length === 0 && <p className="text-center text-muted-foreground p-4">Nenhuma mentoria encontrada.</p>}
            </CardContent>
        </Card>
    );
}

    