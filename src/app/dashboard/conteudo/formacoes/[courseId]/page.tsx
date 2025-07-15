
"use client";

import { useState, useEffect } from 'react';
import { CourseModulesClient } from './modules-client';
import { Course, getCourse } from '@/lib/firebase/firestore';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetailsPage({ params }: { params: { courseId: string } }) {
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            const courseData = await getCourse(params.courseId);
            setCourse(courseData);
            setLoading(false);
        };
        fetchCourse();
    }, [params.courseId]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-full" />
                <div className="pt-6">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full mt-4" />
                </div>
            </div>
        );
    }

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
