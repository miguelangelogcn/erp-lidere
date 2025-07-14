
import { CourseModulesClient } from './modules-client';
import { getCourse } from '@/lib/firebase/firestore';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function CourseDetailsPage({ params }: { params: { courseId: string } }) {
    const course = await getCourse(params.courseId);

    if (!course) {
        return <div>Curso não encontrado.</div>
    }

    return (
        <div className="space-y-4">
             <Link href="/dashboard/conteudo/formacoes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar para Formações
            </Link>
            <h1 className="font-headline text-3xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>
            <CourseModulesClient courseId={params.courseId} />
        </div>
    );
}

    