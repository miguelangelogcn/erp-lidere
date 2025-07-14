import { ProductsClient } from "./products-client";

export default function GerenciarProdutosPage() {
  return (
    <div className="space-y-4">
       <h1 className="font-headline text-3xl font-bold tracking-tight">Gerenciar Produtos</h1>
      <ProductsClient />
    </div>
  );
}
