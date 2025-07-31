// Este arquivo agora contém apenas funções que rodam no servidor e usam o Admin SDK.
import { adminDb } from './server';
import { 
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
} from './firestore-types'; // Usa a nova configuração de admin
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


/**
 * Busca todos os pipelines e suas respectivas negociações.
 * Usa o SDK de Admin para acesso privilegiado no servidor.
 */
export async function getPipelinesWithDeals(): Promise<Pipeline[]> {
  const pipelinesCollection = adminDb.collection('pipelines');
  const pipelinesSnapshot = await pipelinesCollection.orderBy('order').get();
  const pipelines = pipelinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pipeline));

  for (const pipeline of pipelines) {
    const dealsCollection = adminDb.collection('deals');
    const dealsQuery = dealsCollection.where('pipelineId', '==', pipeline.id).orderBy('order');
    const dealsSnapshot = await dealsQuery.get();
    pipeline.deals = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
  }

  return pipelines;
}

/**
 * Busca uma única negociação pelo seu ID.
 * Usa o SDK de Admin para acesso privilegiado no servidor.
 */
export async function getDealById(dealId: string): Promise<Deal | null> {
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealDoc = await dealRef.get();

    if (!dealDoc.exists) {
        return null;
    }

    const dealData = dealDoc.data() as Deal;

    // Fetch contact name
    if (dealData.contactId) {
        const contactDoc = await adminDb.collection('contacts').doc(dealData.contactId).get();
        if (contactDoc.exists) {
            dealData.contactName = contactDoc.data()?.name || 'N/A';
        }
    }

    // Fetch owner name
    if (dealData.ownerId) {
        const ownerDoc = await adminDb.collection('users').doc(dealData.ownerId).get();
        if (ownerDoc.exists) {
            dealData.ownerName = ownerDoc.data()?.name || 'N/A';
        }
    }
    
    return { id: dealDoc.id, ...dealData };
}


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


// Outras funções que precisam de acesso de admin podem ser adicionadas aqui.
export * from './firestore-types';

export const getContacts = async (): Promise<Contact[]> => {
    const contactsCol = collection(db, 'contacts');
    const contactSnapshot = await getDocs(contactsCol);
    return contactSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Contact));
}

export async function addContact(data: Omit<Contact, 'id'>) {
    const contactsCollection = collection(db, 'contacts');
    await addDoc(contactsCollection, { ...data, createdAt: serverTimestamp() });
}

export async function updateContact(id: string, data: Partial<Contact>) {
    const docRef = doc(db, 'contacts', id);
    await updateDoc(docRef, data);
}

export async function deleteContact(id: string) {
    const docRef = doc(db, 'contacts', id);
    await deleteDoc(docRef);
}

export async function createStudentFromContact(contact: Contact, password: string): Promise<void> {
    const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: contact.email,
            password: password,
            name: contact.name,
            roleId: 'student', // or some default student role ID
        }),
    });

    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Falha ao criar usuário.');
    }
}


export const getEmployees = async (): Promise<Employee[]> => {
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    const rolesCol = collection(db, 'roles');
    const rolesSnapshot = await getDocs(rolesCol);
    const rolesData = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        const role = rolesData.find(r => r.id === userData.roleId);
        return {
            ...userData,
            id: doc.id,
            role: role ? role.name : 'N/A'
        } as Employee;
    });
}

export async function updateEmployee(id: string, data: Partial<Employee>) {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, data);
}

export async function deleteEmployee(id: string) {
    const docRef = doc(db, 'users', id);
    await deleteDoc(docRef);
}

export const getRoles = async (): Promise<Role[]> => {
    const rolesCol = collection(db, 'roles');
    const roleSnapshot = await getDocs(rolesCol);
    return roleSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Role));
}

export async function addRole(data: Omit<Role, 'id'>) {
    await addDoc(collection(db, 'roles'), data);
}

export async function updateRole(id: string, data: Partial<Role>) {
    await updateDoc(doc(db, 'roles', id), data);
}

export async function deleteRole(id: string) {
    await deleteDoc(doc(db, 'roles', id));
}

export const systemPages = [
  { id: 'gestao', label: 'Gestão' },
  { id: 'conteudo', label: 'Conteúdo' },
  { id: 'operacoes', label: 'Operações' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'configuracoes', label: 'Configurações' },
];

// PRODUCTS
export async function getProducts(): Promise<Product[]> {
    const q = query(collection(db, "products"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function addProduct(data: Omit<Product, 'id'>) {
    await addDoc(collection(db, 'products'), data);
}

export async function updateProduct(id: string, data: Partial<Product>) {
    await updateDoc(doc(db, 'products', id), data);
}

export async function deleteProduct(id: string) {
    await deleteDoc(doc(db, 'products', id));
}


// ONBOARDING
export async function getOnboardings(): Promise<Onboarding[]> {
  const q = query(collection(db, "onboardings"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Onboarding));
}

export async function startOnboarding(contact: Contact, product: Product): Promise<void> {
  const onboardingCollection = collection(db, 'onboardings');
  
  // Initialize daily tasks with completion status
  const dailyTasks: { [key: string]: OnboardingDailyTask[] } = {};
  Object.keys(product.onboardingPlan).forEach(day => {
    dailyTasks[day] = product.onboardingPlan[day].map(taskText => ({
      text: taskText,
      completed: false,
    }));
  });

  await addDoc(onboardingCollection, {
    contactId: contact.id,
    contactName: contact.name,
    productId: product.id,
    productName: product.name,
    status: 'A Fazer',
    startDate: serverTimestamp(),
    dailyTasks: dailyTasks,
  });
}

export async function updateOnboarding(id: string, data: Partial<Onboarding>) {
    const docRef = doc(db, 'onboardings', id);
    await updateDoc(docRef, data);
}

export async function deleteOnboarding(id: string) {
    await deleteDoc(doc(db, 'onboardings', id));
}

export async function addFollowUpFromOnboarding(contactId: string, studentUserId: string, productId: string) {
    const contactSnap = await getDoc(doc(db, 'contacts', contactId));
    const productSnap = await getDoc(doc(db, 'products', productId));

    if(!contactSnap.exists() || !productSnap.exists()) {
        throw new Error("Contato ou Produto não encontrado para criar o acompanhamento.");
    }
    
    await addDoc(collection(db, 'follow_ups'), {
        contactName: contactSnap.data().name,
        productName: productSnap.data().name,
        studentUserId: studentUserId,
        productId: productId,
        createdAt: serverTimestamp(),
    });
}


// FINANCIAL
export async function getFinancialAccounts(type: FinancialAccountType): Promise<FinancialAccount[]> {
    const q = query(collection(db, "financialAccounts"), where("type", "==", type), orderBy("dueDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
}

export async function addFinancialAccount(data: Omit<FinancialAccount, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'financialAccounts'), { ...data, createdAt: serverTimestamp() });
}

export async function updateFinancialAccount(id: string, data: Partial<FinancialAccount>) {
    await updateDoc(doc(db, 'financialAccounts', id), data);
}

export async function deleteFinancialAccount(id: string) {
    await deleteDoc(doc(db, 'financialAccounts', id));
}

export async function getPayableAccounts(): Promise<FinancialAccount[]> {
  const q = query(collection(db, "financialAccounts"), where("type", "==", "payable"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
}

export async function getAllDeals(): Promise<Deal[]> {
  const q = query(collection(db, "deals"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
}

export async function getFinancialDebts(): Promise<FinancialDebt[]> {
    const q = query(collection(db, "financialDebts"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialDebt));
}

export async function addFinancialDebt(data: Omit<FinancialDebt, 'id'>) {
    await addDoc(collection(db, 'financialDebts'), data);
}

export async function updateFinancialDebt(id: string, data: Partial<FinancialDebt>) {
    await updateDoc(doc(db, 'financialDebts', id), data);
}

export async function deleteFinancialDebt(id: string) {
    await deleteDoc(doc(db, 'financialDebts', id));
}

// Courses
export async function getCourses(): Promise<Course[]> {
    const q = query(collection(db, "courses"), orderBy("title"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
}

export async function getCourse(id: string): Promise<Course | null> {
    const docRef = doc(db, 'courses', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Course : null;
}

export async function addCourse(data: Omit<Course, 'id'>) {
    await addDoc(collection(db, 'courses'), data);
}

export async function updateCourse(id: string, data: Partial<Course>) {
    await updateDoc(doc(db, 'courses', id), data);
}

export async function deleteCourse(id: string) {
    const batch = writeBatch(db);
    const courseRef = doc(db, 'courses', id);
    
    // Delete modules and lessons within the course
    const modulesRef = collection(db, `courses/${id}/modules`);
    const modulesSnap = await getDocs(modulesRef);
    for (const moduleDoc of modulesSnap.docs) {
        const lessonsRef = collection(db, `courses/${id}/modules/${moduleDoc.id}/lessons`);
        const lessonsSnap = await getDocs(lessonsRef);
        for (const lessonDoc of lessonsSnap.docs) {
            batch.delete(lessonDoc.ref);
        }
        batch.delete(moduleDoc.ref);
    }
    
    batch.delete(courseRef);
    await batch.commit();
}


// Modules
export async function getModules(courseId: string): Promise<Module[]> {
    const q = query(collection(db, `courses/${courseId}/modules`), orderBy("order"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
}

export async function getModule(courseId: string, moduleId: string): Promise<Module | null> {
    const docRef = doc(db, `courses/${courseId}/modules`, moduleId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Module : null;
}

export async function addModule(courseId: string, data: Omit<Module, 'id'>) {
    await addDoc(collection(db, `courses/${courseId}/modules`), data);
}

export async function updateModule(courseId: string, moduleId: string, data: Partial<Module>) {
    await updateDoc(doc(db, `courses/${courseId}/modules`, moduleId), data);
}

export async function deleteModule(courseId: string, moduleId: string) {
    await deleteDoc(doc(db, `courses/${courseId}/modules`, moduleId));
}


// Lessons
export async function getLessons(courseId: string, moduleId: string): Promise<Lesson[]> {
    const q = query(collection(db, `courses/${courseId}/modules/${moduleId}/lessons`), orderBy("order"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
}

export async function addLesson(courseId: string, moduleId: string, data: Omit<Lesson, 'id'>) {
    await addDoc(collection(db, `courses/${courseId}/modules/${moduleId}/lessons`), data);
}

export async function updateLesson(courseId: string, moduleId: string, lessonId: string, data: Partial<Lesson>) {
    await updateDoc(doc(db, `courses/${courseId}/modules/${moduleId}/lessons`, lessonId), data);
}

export async function deleteLesson(courseId: string, moduleId: string, lessonId: string) {
    await deleteDoc(doc(db, `courses/${courseId}/modules/${moduleId}/lessons`, lessonId));
}


// Student/User specific data
export async function getAssignedCourses(courseIds: string[]): Promise<Course[]> {
    if (courseIds.length === 0) return [];
    
    const courses: Course[] = [];
    for (const id of courseIds) {
        const courseDoc = await getDoc(doc(db, 'courses', id));
        if (courseDoc.exists()) {
            courses.push({ id: courseDoc.id, ...courseDoc.data() } as Course);
        }
    }
    return courses;
}


export async function getUserProgress(userId: string): Promise<UserProgress> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().progress) {
        return docSnap.data().progress;
    }
    return {};
}

export async function updateUserProgress(userId: string, lessonId: string, completed: boolean) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        [`progress.${lessonId}`]: completed,
    });
}

export async function getStudents(): Promise<Employee[]> {
  const usersCollection = collection(db, "users");
  
  // Assuming 'student' role has a specific ID you can query for.
  // This needs to be adapted if role definition changes.
  // For this example, let's assume we fetch all users and filter client-side,
  // which is not ideal for large datasets but works for this structure.
  const roleQuery = query(collection(db, 'roles'), where('name', '==', 'Student'));
  const roleSnapshot = await getDocs(roleQuery);
  if(roleSnapshot.empty) return [];

  const studentRoleId = roleSnapshot.docs[0].id;

  const q = query(usersCollection, where("roleId", "==", studentRoleId));
  const usersSnapshot = await getDocs(q);
  
  return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
      assignedCourses: doc.data().assignedCourses || [],
  } as Employee));
}

export async function getStudentsFromContacts(): Promise<Contact[]> {
  const q = query(collection(db, "contacts"), where("userId", "!=", null));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}


export async function getFollowUps(studentId?: string): Promise<FollowUp[]> {
    let q;
    if (studentId) {
        // Query for a specific student
        q = query(collection(db, "follow_ups"), where("studentUserId", "==", studentId), orderBy("createdAt", "desc"));
    } else {
        // Query for all follow-ups (for admins/mentors)
        q = query(collection(db, "follow_ups"), orderBy("createdAt", "desc"));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
    } as FollowUp));
}

export async function createFollowUp(data: { studentUserId: string; contactName: string; productId: string; productName: string; }) {
    await addDoc(collection(db, 'follow_ups'), {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function deleteFollowUp(id: string) {
    await deleteDoc(doc(db, 'follow_ups', id));
}

export function getActionPlanTasks(followUpId: string, callback: (tasks: ActionPlanTask[]) => void) {
    const q = query(collection(db, `follow_ups/${followUpId}/action_plan`), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const tasks = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ActionPlanTask));
        callback(tasks);
    });
}

export async function addActionPlanTask(followUpId: string, text: string) {
    await addDoc(collection(db, `follow_ups/${followUpId}/action_plan`), {
        text,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
}

export async function updateActionPlanTask(followUpId: string, taskId: string, data: Partial<ActionPlanTask>) {
    await updateDoc(doc(db, `follow_ups/${followUpId}/action_plan`, taskId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export function getMentorships(followUpId: string, callback: (mentorships: Mentorship[]) => void) {
    const q = query(collection(db, `follow_ups/${followUpId}/mentorships`), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const mentorships = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        } as Mentorship));
        callback(mentorships);
    });
}

export async function addMentorship(followUpId: string, data: Omit<Mentorship, 'id' | 'createdAt'>) {
    await addDoc(collection(db, `follow_ups/${followUpId}/mentorships`), {
        ...data,
        createdAt: new Date(), // Using client-side date for simplicity here
    });
}


// Marketing / Campaigns
export async function getCampaigns(): Promise<Campaign[]> {
    const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
}


export async function getAllTags(): Promise<string[]> {
    const contactsSnapshot = await getDocs(collection(db, 'contacts'));
    const allTags = new Set<string>();
    contactsSnapshot.forEach(doc => {
        const tags = doc.data().tags;
        if (Array.isArray(tags)) {
            tags.forEach(tag => allTags.add(tag));
        }
    });
    return Array.from(allTags);
}


export async function updateCampaign(id: string, data: Partial<Campaign>) {
    const docRef = doc(db, 'campaigns', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function addDispatch(dispatchData: Omit<Dispatch, 'id'>) {
    await addDoc(collection(db, 'dispatches'), dispatchData);
}

export function getCampaignDispatches(campaignId: string, callback: (dispatches: Dispatch[]) => void) {
    const q = query(collection(db, "dispatches"), where("campaignId", "==", campaignId), orderBy("sentAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const dispatches = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Dispatch));
        callback(dispatches);
    });
}

    
