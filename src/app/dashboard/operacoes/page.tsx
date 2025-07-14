import { redirect } from 'next/navigation';

export default function OperacoesPage() {
  // Redirect to the first page in the operations module
  redirect('/dashboard/operacoes/produtos');
}
