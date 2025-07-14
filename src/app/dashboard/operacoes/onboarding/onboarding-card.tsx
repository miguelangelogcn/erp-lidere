"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Onboarding } from "@/lib/firebase/firestore";
import { GripVertical } from "lucide-react";

interface OnboardingCardProps {
  onboarding: Onboarding;
  onClick: () => void;
}

export function OnboardingCard({ onboarding, onClick }: OnboardingCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: onboarding.id,
    disabled: onboarding.status !== 'Fazendo' && onboarding.status !== 'A Fazer',
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const totalTasks = Object.values(onboarding.dailyTasks).flat().length;
  const completedTasks = Object.values(onboarding.dailyTasks).flat().filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div ref={setNodeRef} style={style} >
      <Card onClick={onClick} className="cursor-pointer hover:shadow-md transition-shadow group">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-base font-medium">{onboarding.contactName}</CardTitle>
          <div {...listeners} {...attributes} className="cursor-grab p-1 opacity-50 group-hover:opacity-100">
             <GripVertical className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground">{onboarding.productName}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Badge variant={onboarding.status === 'Feito' ? 'default' : 'secondary'}>{onboarding.status}</Badge>
        </CardFooter>
      </Card>
    </div>
  );
}
