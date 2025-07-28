
import { redirect } from 'next/navigation';

export default function MarketingPage() {
  // Como a funcionalidade de campanhas foi removida,
  // esta página pode redirecionar para o dashboard principal
  // ou para outra seção, se aplicável.
  redirect('/dashboard');
}
