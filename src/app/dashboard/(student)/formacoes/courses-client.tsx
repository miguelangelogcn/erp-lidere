
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Course, Employee, getAssignedCourses } from "@/lib/firebase/firestore";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentCoursesClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAssignedCourses = async () => {
      if (!user) return;
      setPageLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Employee;
            const assignedCourseIds = userData.assignedCourses || [];
            const assignedCoursesData = await getAssignedCourses(assignedCourseIds);
            setCourses(assignedCoursesData);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar seus cursos." });
      } finally {
        setPageLoading(false);
      }
    };

    fetchAssignedCourses();
  }, [user, toast]);

  const handleCardClick = (courseId: string) => {
    router.push(`/dashboard/formacoes/${courseId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {pageLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
      ) : courses.length > 0 ? (
        courses.map((course) => (
          <Card key={course.id} onClick={() => handleCardClick(course.id)} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
              <CardDescription className="mt-2 line-clamp-3">{course.description}</CardDescription>
            </CardHeader>
          </Card>
        ))
      ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Você ainda não foi atribuído a nenhum curso.</p>
          </div>
      )}
    </div>
  );
}

    