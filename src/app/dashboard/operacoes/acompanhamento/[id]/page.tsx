"use client";

import { FollowUpClient } from "./follow-up-client";

export default function FollowUpDetailsPage({ params }: { params: { id: string } }) {
  return <FollowUpClient followUpId={params.id} />;
}
