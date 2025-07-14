import { PipelinesClient } from "./pipelines-client";

export default function PipelinesPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
         <h1 className="font-headline text-3xl font-bold tracking-tight mb-4">Pipelines de Vendas</h1>
      </div>
      <PipelinesClient />
    </div>
  );
}
