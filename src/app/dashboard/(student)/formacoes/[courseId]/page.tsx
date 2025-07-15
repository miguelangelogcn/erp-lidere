
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Course, Module, Lesson, UserProgress, getCourse, getModules, getLessons, getUserProgress, updateUserProgress } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Paperclip, CheckCircle, Circle } from 'lucide-react';
import { getYouTubeEmbedUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

export default function StudentCoursePage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const { user } = useAuth();
    
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<ModuleWithLessons[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId) return;

        const fetchData = async () => {
            setLoading(true);
            const courseData = await getCourse(courseId);
            setCourse(courseData);

            if (courseData) {
                const modulesData = await getModules(courseId);
                const modulesWithLessons: ModuleWithLessons[] = await Promise.all(
                    modulesData.map(async (module) => {
                        const lessonsData = await getLessons(courseId, module.id);
                        return { ...module, lessons: lessonsData };
                    })
                );
                setModules(modulesWithLessons);

                if (user) {
                    const progressData = await getUserProgress(user.uid);
                    setUserProgress(progressData);
                }

                // Select the first lesson of the first module by default
                if (modulesWithLessons.length > 0 && modulesWithLessons[0].lessons.length > 0) {
                    setSelectedLesson(modulesWithLessons[0].lessons[0]);
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [courseId, user]);

    const handleLessonClick = (lesson: Lesson) => {
        setSelectedLesson(lesson);
    };

    const handleProgressChange = async (lessonId: string, completed: boolean) => {
        if (!user) return;
        setUserProgress(prev => ({...prev, [lessonId]: completed}));
        await updateUserProgress(user.uid, lessonId, completed);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-2 space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="col-span-1 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        )
    }

    if (!course) {
        return <div>Curso não encontrado.</div>
    }

    const embedUrl = selectedLesson?.videoUrl ? getYouTubeEmbedUrl(selectedLesson.videoUrl) : null;

    return (
        <div className="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/formacoes">Minhas Formações</Link></BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>{course.title}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    {selectedLesson ? (
                        <div className="space-y-6">
                             {embedUrl && (
                                <div className="aspect-video w-full overflow-hidden rounded-lg border">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={embedUrl}
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                            <h1 className="font-headline text-3xl font-bold tracking-tight">{selectedLesson.title}</h1>
                            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                           
                            {selectedLesson.attachments.length > 0 && (
                                <div className="space-y-2 pt-4">
                                    <h3 className="font-semibold">Materiais de Apoio</h3>
                                    <ul className="list-disc list-inside">
                                        {selectedLesson.attachments.map(att => (
                                            <li key={att.url}>
                                                <a href={att.url} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
                                                    <Paperclip className='inline-block mr-1 h-4 w-4'/>{att.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                           )}

                           <div className="flex items-center space-x-2 pt-4">
                                <Checkbox 
                                    id={`progress-${selectedLesson.id}`} 
                                    checked={!!userProgress[selectedLesson.id]}
                                    onCheckedChange={(checked) => handleProgressChange(selectedLesson.id, !!checked)}
                                />
                                <label htmlFor={`progress-${selectedLesson.id}`} className="text-sm font-medium leading-none">
                                    Marcar como concluída
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Selecione uma aula para começar.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar with lessons */}
                <div className="lg:col-span-1">
                    <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="w-full">
                        {modules.map(module => (
                            <AccordionItem key={module.id} value={module.id}>
                                <AccordionTrigger>{module.title}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-1">
                                        {module.lessons.map(lesson => (
                                            <li key={lesson.id}>
                                                <button 
                                                    onClick={() => handleLessonClick(lesson)}
                                                    className={`w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${selectedLesson?.id === lesson.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                                                >
                                                   {userProgress[lesson.id] ? <CheckCircle className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
                                                   <span className="flex-grow">{lesson.title}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    );
}

