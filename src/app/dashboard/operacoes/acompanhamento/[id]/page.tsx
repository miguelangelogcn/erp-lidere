"use client";

import { useParams } from 'next/navigation';
import { FollowUpClient } from "./follow-up-client";

export default function FollowUpDetailsPage() {
  const params = useParams();
  const followUpId = params.id as string;
  
  if (!followUpId) {
    return <div>Carregando...</div>;
  }
  
  return <FollowUpClient followUpId={followUpId} />;
}
