"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MentorshipsTab } from "./mentorships-tab";
import { ActionPlanTab } from "./action-plan-tab";
import { ValidationTab } from "./validation-tab";

interface FollowUpClientProps {
    followUpId: string;
}

export function FollowUpClient({ followUpId }: FollowUpClientProps) {
    return (
        <div className="space-y-4">
             <h1 className="font-headline text-3xl font-bold tracking-tight">Detalhes do Acompanhamento</h1>
             <Tabs defaultValue="mentorships" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mentorships">Mentorias</TabsTrigger>
                    <TabsTrigger value="actionPlan">Plano de Ação</TabsTrigger>
                    <TabsTrigger value="validation">Validação de Tarefas</TabsTrigger>
                </TabsList>
                <TabsContent value="mentorships">
                    <MentorshipsTab followUpId={followUpId} />
                </TabsContent>
                <TabsContent value="actionPlan">
                    <ActionPlanTab followUpId={followUpId} />
                </TabsContent>
                <TabsContent value="validation">
                    <ValidationTab followUpId={followUpId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
