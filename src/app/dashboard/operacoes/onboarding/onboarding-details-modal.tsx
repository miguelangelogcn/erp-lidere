"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Onboarding, OnboardingDailyTask, updateOnboarding } from "@/lib/firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OnboardingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onboarding: Onboarding;
  onOnboardingUpdated: () => void;
}

const days = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

export function OnboardingDetailsModal({ isOpen, onClose, onboarding, onOnboardingUpdated }: OnboardingDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [dailyTasks, setDailyTasks] = useState(onboarding.dailyTasks);
  const { toast } = useToast();

  const handleTaskChange = (day: string, taskIndex: number, completed: boolean) => {
    setDailyTasks(prevTasks => {
        const newTasksForDay = [...(prevTasks[day] || [])];
        newTasksForDay[taskIndex] = { ...newTasksForDay[taskIndex], completed };
        return { ...prevTasks, [day]: newTasksForDay };
    });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
        await updateOnboarding(onboarding.id, { dailyTasks });
        toast({ title: "Sucesso", description: "Checklist salvo." });
        onOnboardingUpdated();
        onClose();
    } catch(error) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar as alterações." });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Checklist de Onboarding - {onboarding.contactName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                {days.map(day => (
                    <Card key={day}>
                        <CardHeader><CardTitle>{day}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                           {(dailyTasks[day] || []).map((task, index) => (
                               <div key={index} className="flex items-center space-x-2">
                                   <Checkbox 
                                        id={`${day}-${index}`} 
                                        checked={task.completed} 
                                        onCheckedChange={(checked) => handleTaskChange(day, index, !!checked)}
                                    />
                                   <label htmlFor={`${day}-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                       {task.text}
                                    </label>
                               </div>
                           ))}
                           {(dailyTasks[day] || []).length === 0 && (
                                <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>
                           )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
        <DialogFooter className="mt-4 p-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveChanges} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
