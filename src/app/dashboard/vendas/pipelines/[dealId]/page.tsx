import { getDealById } from '@/lib/firebase/firestore'; 
import { DealDetailsClient } from './deal-details-client'; 
import { notFound } from 'next/navigation';

export default async function DealDetailsPage({ params }: { params: { dealId: string } }) {
  const deal = await getDealById(params.dealId);

  if (!deal) {
    return notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DealDetailsClient deal={deal} />
    </div>
  );
}
