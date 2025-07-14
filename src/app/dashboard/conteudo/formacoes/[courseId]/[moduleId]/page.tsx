
import { LessonsClient } from './lessons-client';
import { getCourse, getModules } from '@/lib/firebase/firestore';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default async function ModuleDetailsPage({ params }: { params: { courseId: string; moduleId: string } }) {
    const course = await getCourse(params.courseId);
    const modules = await getModules(params.courseId);
    const module = modules.find(m => m.id === params.moduleId);

    if (!course || !module) {
        return <div>Curso ou módulo não encontrado.</div>
    }

    return (
        <div className="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/conteudo/formacoes">Formações</Link></BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href={`/dashboard/conteudo/formacoes/${params.courseId}`}>{course.title}</Link></BreadcrumbLink></BreadcrumbItem>
                     <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>{module.title}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="font-headline text-3xl font-bold tracking-tight">Aulas do Módulo: {module.title}</h1>
            <p className="text-muted-foreground">Adicione e gerencie as aulas deste módulo.</p>

            <LessonsClient courseId={params.courseId} moduleId={params.moduleId} />
        </div>
    );
}

    