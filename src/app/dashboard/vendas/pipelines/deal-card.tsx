"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { type Deal } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  isSelected: boolean;
}

export function DealCard({ deal, onClick, isSelected }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} >
      <Card 
        onClick={onClick} 
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow group border-0",
          isSelected && "bg-primary/10"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-base font-medium">{deal.title}</CardTitle>
          <div {...listeners} {...attributes} className="cursor-grab p-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-lg font-bold text-primary">{formatCurrency(deal.value)}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between text-sm text-muted-foreground">
          <span>{deal.contactName}</span>
          <span>{deal.ownerName}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
