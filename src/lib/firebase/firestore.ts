// src/lib/firebase/firestore.ts

import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./client"; // Importa a conexão correta do cliente

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Campaign {
  id: string;
  name: string;
  contactIds: string[];
  channels: ('email' | 'whatsapp')[];
  emailContent?: {
    subject: string;
    body: string;
  };
  createdAt: any;
}

export interface Dispatch {
  id: string;
  campaignId: string;
  dispatchDate: any;
  status: 'success' | 'failed';
  channel: 'email' | 'whatsapp';
  error?: string;
}

// Esta função usa a sintaxe correta do CLIENT SDK
export async function getCampaigns(): Promise<Campaign[]> {
  const campaignsCol = collection(db, "campaigns"); // Usa collection() do 'firebase/firestore'
  const querySnapshot = await getDocs(campaignsCol);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
}

export async function getContacts(): Promise<Contact[]> {
  const contactsCol = collection(db, "contacts"); // Usa collection() do 'firebase/firestore'
  const querySnapshot = await getDocs(contactsCol);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}