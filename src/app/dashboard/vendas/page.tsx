import { redirect } from 'next/navigation';

export default function VendasPage() {
  // Redirect to the first page in the sales module
  redirect('/dashboard/vendas/contatos');
}
