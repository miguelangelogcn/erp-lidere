"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 h-full bg-muted rounded-lg p-2 flex flex-col",
        isOver ? "ring-2 ring-primary" : ""
      )}
    >
      <h3 className="font-semibold text-lg px-2 py-1 mb-2">{title}</h3>
      <div className="flex-grow space-y-3 overflow-y-auto p-1">
        {children}
      </div>
    </div>
  );
}
