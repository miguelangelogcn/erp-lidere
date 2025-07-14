
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentMentorshipsTab } from "./mentorships-tab";
import { StudentActionPlanTab } from "./action-plan-tab";

interface FollowUpClientProps {
    params: { id: string }
}

export default function StudentFollowUpDetailsPage({ params }: FollowUpClientProps) {
    const followUpId = params.id;
    return (
        <div className="space-y-4">
             <h1 className="font-headline text-3xl font-bold tracking-tight">Detalhes do Acompanhamento</h1>
             <Tabs defaultValue="actionPlan" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="actionPlan">Plano de Ação</TabsTrigger>
                    <TabsTrigger value="mentorships">Mentorias</TabsTrigger>
                </TabsList>
                <TabsContent value="actionPlan">
                    <StudentActionPlanTab followUpId={followUpId} />
                </TabsContent>
                <TabsContent value="mentorships">
                    <StudentMentorshipsTab followUpId={followUpId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

    