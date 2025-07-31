
// src/lib/firebase/firestore-client.ts

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';
import type {
  Pipeline,
  Deal,
  Contact,
  Employee,
  Role,
  Product,
  Onboarding,
  OnboardingDailyTask,
  FinancialAccount,
  FinancialAccountType,
  RecurrenceType,
  FinancialDebt,
  Course,
  Module,
  Lesson,
  ActionPlanTask,
  Mentorship,
  FollowUp,
  UserProgress,
  Campaign,
  Dispatch
} from './firestore';

// Função para atualizar uma negociação (deal)
export async function updateDeal(dealId: string, data: Partial<Deal>): Promise<void> {
  const dealRef = doc(db, 'deals', dealId);
  await updateDoc(dealRef, data);
}

// Adicione aqui outras funções do Firestore que precisam ser executadas no lado do cliente.
// Por exemplo, as funções de CRUD para as coleções que você já tem.

export async function getPipelines(): Promise<Pipeline[]> {
  const q = query(collection(db, "pipelines"), orderBy("order"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pipeline));
}

export async function addPipeline(data: Omit<Pipeline, 'id' | 'order' | 'deals'>) {
    const pipelinesCollection = collection(db, 'pipelines');
    const allPipelines = await getDocs(pipelinesCollection);
    const newOrder = allPipelines.size;
    
    await addDoc(pipelinesCollection, {
        ...data,
        order: newOrder,
    });
}

export async function updatePipeline(id: string, data: Partial<Omit<Pipeline, 'id' | 'order' | 'deals'>>) {
    const docRef = doc(db, 'pipelines', id);
    await updateDoc(docRef, data);
}

export async function deletePipeline(id: string) {
    const docRef = doc(db, 'pipelines', id);
    // TODO: Adicionar lógica para lidar com negociações dentro do pipeline excluído
    await deleteDoc(docRef);
}


export async function getContacts(): Promise<Contact[]> {
  const q = query(collection(db, 'contacts'), orderBy('name'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}

export async function getEmployees(): Promise<Employee[]> {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  
  const employees: Employee[] = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    let roleName = 'N/A';
    
    if (userData.roleId) {
      const roleDocRef = doc(db, 'roles', userData.roleId);
      const roleDoc = await getDoc(roleDocRef);
      if (roleDoc.exists()) {
        roleName = roleDoc.data().name;
      }
    }
    
    employees.push({
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
    });
  }
  
  return employees;
}


export async function addDeal(data: Omit<Deal, 'id' | 'order' | 'contactName' | 'ownerName'>) {
    const dealsCollection = collection(db, 'deals');
    const dealsInStage = await getDocs(query(dealsCollection, where('stage', '==', data.stage)));
    const newOrder = dealsInStage.size;

    const contactSnap = await getDoc(doc(db, 'contacts', data.contactId));
    const ownerSnap = await getDoc(doc(db, 'users', data.ownerId));

    await addDoc(dealsCollection, {
        ...data,
        order: newOrder,
        contactName: contactSnap.data()?.name || 'N/A',
        ownerName: ownerSnap.data()?.name || 'N/A',
        createdAt: serverTimestamp(),
    });
}

export async function deleteDeal(id: string) {
    const docRef = doc(db, 'deals', id);
    await deleteDoc(docRef);
}
