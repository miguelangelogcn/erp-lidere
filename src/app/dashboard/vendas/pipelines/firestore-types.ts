// This file defines shared types for Firestore documents.

export interface Pipeline {
    id: string;
    name: string;
    stages: string[];
    deals?: Deal[];
    order: number;
}
  
export interface Deal {
    id: string;
    title: string;
    value: number;
    pipelineId: string;
    stage: string;
    order: number;
    contactId: string;
    ownerId: string;

    // Optional fields populated after fetching
    contactName?: string;
    ownerName?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
}
