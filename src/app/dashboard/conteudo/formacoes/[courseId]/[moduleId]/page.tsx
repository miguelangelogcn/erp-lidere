"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LessonsClient } from './lessons-client';
import { Course, Module, getCourse, getModule } from '@/lib/firebase/firestore';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

export default function ModuleDetailsPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const moduleId = params.moduleId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [module, setModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId || !moduleId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const courseData = await getCourse(courseId);
                const moduleData = await getModule(courseId, moduleId);
                setCourse(courseData);
                setModule(moduleData);
            } catch (error) {
                console.error("Error fetching data:", error);
                // Optionally show a toast message here
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, moduleId]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-full" />
                <div className="pt-6">
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }
    
    if (!course || !module) {
        return <div>Curso ou módulo não encontrado.</div>
    }

    return (
        <div className="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/conteudo/formacoes">Formações</Link></BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href={`/dashboard/conteudo/formacoes/${courseId}`}>{course.title}</Link></BreadcrumbLink></BreadcrumbItem>
                     <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>{module.title}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="font-headline text-3xl font-bold tracking-tight">Aulas do Módulo: {module.title}</h1>
            <p className="text-muted-foreground">Adicione e gerencie as aulas deste módulo.</p>

            <LessonsClient courseId={courseId} moduleId={moduleId} />
        </div>
    );
}