"use client";

import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentMentorshipsTab } from "./mentorships-tab";
import { StudentActionPlanTab } from "./action-plan-tab";

export default function StudentFollowUpDetailsPage() {
    const params = useParams();
    const followUpId = params.id as string;

    if (!followUpId) {
        // You can render a loading state or a message here
        return <div>Carregando...</div>;
    }

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
