// src/lib/firebase/firestore.ts

import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./client";

// Re-export db for use in other parts of the app if needed, though it's better to import from client.
export { db, doc, getDoc, Timestamp };


// Tipos de Dados

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  userId?: string; // ID do usuário no Firebase Auth, se for um aluno
}

export interface Company {
    id: string;
    name: string;
    website?: string;
    phone?: string;
}

export interface Pipeline {
    id: string;
    name: string;
    stages: string[];
}

export interface Deal {
    id: string;
    title: string;
    value: number;
    pipelineId: string;
    stage: string;
    contactId: string;
    contactName: string;
    ownerId: string;
    ownerName: string;
}

export interface Note {
    id: string;
    content: string;
    author: string;
    createdAt: any; // Firestore Timestamp
}


export interface Role {
  id: string;
  name: string;
  permissions: { [key: string]: boolean };
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    roleId: string;
    role?: string; // Nome do cargo (para exibição)
    assignedCourses?: string[];
}

export const systemPages = [
  { id: 'gestao', label: 'Gestão' },
  { id: 'conteudo', label: 'Conteúdo' },
  { id: 'operacoes', label: 'Operações' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'relatorios', label: 'Relatórios' },
];


export interface Course {
    id: string;
    title: string;
    description: string;
}

export interface Module {
    id: string;
    title: string;
    order: number;
}

export interface Lesson {
    id: string;
    title: string;
    order: number;
    content: string;
    videoUrl?: string;
    attachments: { name: string, url: string }[];
}

export type UserProgress = {
    [lessonId: string]: boolean;
}

export interface Product {
    id:string;
    name: string;
    value: number;
    onboardingPlan: { [day: string]: string[] }
}

export interface OnboardingDailyTask {
    text: string;
    completed: boolean;
}
export interface Onboarding {
    id: string;
    contactId: string;
    contactName: string;
    productId: string;
    productName: string;
    status: 'A Fazer' | 'Fazendo' | 'Feito';
    dailyTasks: { [day: string]: OnboardingDailyTask[] };
}

export interface FollowUp {
    id: string;
    studentUserId: string;
    contactName: string;
    productId: string;
    productName: string;
    createdAt: any; // Timestamp
}

export interface Mentorship {
    id: string;
    videoUrl: string;
    transcript: string;
    attachments: { name: string; url: string }[];
    createdAt?: any;
}

export interface ActionPlanTask {
    id: string;
    text: string;
    status: 'pending' | 'completed' | 'validated';
    submittedText?: string;
    submittedFileUrl?: string;
}

export type FinancialAccountType = 'receivable' | 'payable';
export type RecurrenceType = "none" | "weekly" | "monthly" | "yearly";

export interface FinancialAccount {
    id: string;
    type: FinancialAccountType;
    description: string;
    value: number;
    dueDate: Timestamp;
    category: string;
    recurrence: RecurrenceType;
    createdAt?: Timestamp;
}

export interface FinancialDebt {
    id: string;
    name: string;
    creditor: string;
    totalValue: number;
    interestRate: string;
}


// Funções CRUD

// Contatos
export const getContacts = async (): Promise<Contact[]> => {
  const querySnapshot = await getDocs(collection(db, "contacts"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
};
export const addContact = (data: Omit<Contact, 'id'>) => addDoc(collection(db, 'contacts'), data);
export const updateContact = (id: string, data: Partial<Contact>) => updateDoc(doc(db, 'contacts', id), data);
export const deleteContact = (id: string) => deleteDoc(doc(db, 'contacts', id));

// Empresas
export const getCompanies = async (): Promise<Company[]> => {
    const querySnapshot = await getDocs(collection(db, "companies"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
};
export const addCompany = (data: Omit<Company, 'id'>) => addDoc(collection(db, 'companies'), data);
export const updateCompany = (id: string, data: Partial<Company>) => updateDoc(doc(db, 'companies', id), data);
export const deleteCompany = (id: string) => deleteDoc(doc(db, 'companies', id));


// Pipelines
export const getPipelines = async (): Promise<Pipeline[]> => {
    const querySnapshot = await getDocs(collection(db, "pipelines"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pipeline));
};
export const addPipeline = (data: Omit<Pipeline, 'id'>) => addDoc(collection(db, 'pipelines'), data);
export const updatePipeline = (id: string, data: Partial<Pipeline>) => updateDoc(doc(db, 'pipelines', id), data);
export const deletePipeline = (id: string) => deleteDoc(doc(db, 'pipelines', id));


// Negociações (Deals)
export const getDealsByPipeline = async (pipelineId: string): Promise<Deal[]> => {
    const q = query(collection(db, 'deals'), where('pipelineId', '==', pipelineId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
};
export const getAllDeals = async (): Promise<Deal[]> => {
    const querySnapshot = await getDocs(collection(db, "deals"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
}
export const addDeal = async (data: Omit<Deal, 'id' | 'contactName' | 'ownerName'>) => {
    const contactSnap = await getDoc(doc(db, 'contacts', data.contactId));
    const ownerSnap = await getDoc(doc(db, 'users', data.ownerId));
    const dealData = {
        ...data,
        contactName: contactSnap.data()?.name || 'N/A',
        ownerName: ownerSnap.data()?.name || 'N/A',
    };
    return addDoc(collection(db, 'deals'), dealData);
};
export const updateDeal = async (id: string, data: Partial<Deal>) => {
    const dealRef = doc(db, 'deals', id);
    const updateData = {...data};

    // Se contactId ou ownerId mudou, atualize os nomes correspondentes
    if (data.contactId) {
        const contactSnap = await getDoc(doc(db, 'contacts', data.contactId));
        updateData.contactName = contactSnap.data()?.name || 'N/A';
    }
    if (data.ownerId) {
        const ownerSnap = await getDoc(doc(db, 'users', data.ownerId));
        updateData.ownerName = ownerSnap.data()?.name || 'N/A';
    }
    
    return updateDoc(dealRef, updateData);
};
export const deleteDeal = (id: string) => deleteDoc(doc(db, 'deals', id));


// Notas da Negociação
export const getNotes = (dealId: string, callback: (notes: Note[]) => void) => {
    const q = query(collection(db, 'deals', dealId, 'notes'));
    return onSnapshot(q, (querySnapshot) => {
        const notes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        } as Note));
        callback(notes);
    });
};
export const addNote = (dealId: string, data: Omit<Note, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'deals', dealId, 'notes'), {
        ...data,
        createdAt: serverTimestamp()
    });
};


// Cargos (Roles)
export const getRoles = async (): Promise<Role[]> => {
    const querySnapshot = await getDocs(collection(db, "roles"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};
export const addRole = (data: Omit<Role, 'id'>) => addDoc(collection(db, 'roles'), data);
export const updateRole = (id: string, data: Partial<Role>) => updateDoc(doc(db, 'roles', id), data);
export const deleteRole = (id: string) => deleteDoc(doc(db, 'roles', id));


// Funcionários (Employees)
export const getEmployees = async (): Promise<Employee[]> => {
    const usersSnapshot = await getDocs(query(collection(db, 'users')));
    const rolesSnapshot = await getDocs(collection(db, 'roles'));
    const rolesMap = new Map(rolesSnapshot.docs.map(doc => [doc.id, doc.data().name]));

    const employees = usersSnapshot.docs
        .map(doc => {
            const data = doc.data();
            // Filtra para incluir apenas usuários com roleId (exclui alunos)
            if (!data.roleId) return null;
            return {
                id: doc.id,
                ...data,
                role: rolesMap.get(data.roleId) || 'N/A'
            } as Employee;
        })
        .filter((emp): emp is Employee => emp !== null);
        
    return employees;
};
export const updateEmployee = (id: string, data: Partial<Employee>) => updateDoc(doc(db, 'users', id), data);
export const deleteEmployee = (id: string) => deleteDoc(doc(db, 'users', id)); // CUIDADO: Isso não deleta do Auth


// Alunos (Students)
export const getStudents = async (): Promise<Employee[]> => {
    const rolesSnapshot = await getDocs(query(collection(db, 'roles'), where('name', '==', 'Student')));
    if (rolesSnapshot.empty) return [];
    
    const studentRoleId = rolesSnapshot.docs[0].id;
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('roleId', '==', studentRoleId)));

    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};
export const createStudentFromContact = async (contact: Contact, password: string) => {
    // 1. Verifica se já existe um usuário com este email
    const userQuery = query(collection(db, 'users'), where('email', '==', contact.email));
    const existingUsers = await getDocs(userQuery);
    if (!existingUsers.empty) {
        throw new Error("Este e-mail já está em uso por outro usuário.");
    }
    
    // 2. Busca o ID do cargo "Student"
    const rolesSnapshot = await getDocs(query(collection(db, 'roles'), where('name', '==', 'Student')));
    if (rolesSnapshot.empty) {
        throw new Error("O cargo 'Student' não foi encontrado. Crie-o na área de Gestão.");
    }
    const studentRoleId = rolesSnapshot.docs[0].id;

    // 3. Chama a API para criar o usuário no Firebase Auth e no Firestore
    const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: contact.email,
            password: password,
            name: contact.name,
            roleId: studentRoleId,
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || "Falha ao criar o acesso de aluno.");
    }
    
    // 4. Atualiza o contato com o ID do novo usuário
    await updateContact(contact.id, { userId: result.uid });

    return result;
}


// Cursos (Courses)
export const getCourses = async (): Promise<Course[]> => {
    const querySnapshot = await getDocs(collection(db, "courses"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};
export const getAssignedCourses = async (courseIds: string[]): Promise<Course[]> => {
    if (courseIds.length === 0) return [];
    const courseDocs = await Promise.all(courseIds.map(id => getDoc(doc(db, 'courses', id))));
    return courseDocs.filter(doc => doc.exists()).map(doc => ({ id: doc.id, ...doc.data() } as Course));
};
export const getCourse = async (id: string): Promise<Course | null> => {
    const docSnap = await getDoc(doc(db, 'courses', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Course : null;
};
export const addCourse = (data: Omit<Course, 'id'>) => addDoc(collection(db, 'courses'), data);
export const updateCourse = (id: string, data: Partial<Course>) => updateDoc(doc(db, 'courses', id), data);
export const deleteCourse = (id: string) => deleteDoc(doc(db, 'courses', id));

// Módulos
export const getModules = async (courseId: string): Promise<Module[]> => {
    const q = query(collection(db, `courses/${courseId}/modules`));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module)).sort((a,b) => a.order - b.order);
};
export const getModule = async (courseId: string, moduleId: string): Promise<Module | null> => {
    const docSnap = await getDoc(doc(db, `courses/${courseId}/modules`, moduleId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Module : null;
};
export const addModule = (courseId: string, data: Omit<Module, 'id'>) => addDoc(collection(db, `courses/${courseId}/modules`), data);
export const updateModule = (courseId: string, moduleId: string, data: Partial<Module>) => updateDoc(doc(db, `courses/${courseId}/modules`, moduleId), data);
export const deleteModule = (courseId: string, moduleId: string) => deleteDoc(doc(db, `courses/${courseId}/modules`, moduleId));


// Aulas (Lessons)
export const getLessons = async (courseId: string, moduleId: string): Promise<Lesson[]> => {
    const q = query(collection(db, `courses/${courseId}/modules/${moduleId}/lessons`));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)).sort((a, b) => a.order - b.order);
};
export const addLesson = (courseId: string, moduleId: string, data: Omit<Lesson, 'id'>) => addDoc(collection(db, `courses/${courseId}/modules/${moduleId}/lessons`), data);
export const updateLesson = (courseId: string, moduleId: string, lessonId: string, data: Partial<Lesson>) => updateDoc(doc(db, `courses/${courseId}/modules/${moduleId}/lessons`, lessonId), data);
export const deleteLesson = (courseId: string, moduleId: string, lessonId: string) => deleteDoc(doc(db, `courses/${courseId}/modules/${moduleId}/lessons`, lessonId));


// User Progress
export const getUserProgress = async (userId: string): Promise<UserProgress> => {
    const docRef = doc(db, 'userProgress', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().completedLessons || {};
    }
    return {};
};
export const updateUserProgress = async (userId: string, lessonId: string, completed: boolean) => {
    const docRef = doc(db, 'userProgress', userId);
    return updateDoc(docRef, {
        [`completedLessons.${lessonId}`]: completed
    }, { merge: true });
};


// Produtos
export const getProducts = async (): Promise<Product[]> => {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};
export const addProduct = (data: Omit<Product, 'id'>) => addDoc(collection(db, 'products'), data);
export const updateProduct = (id: string, data: Partial<Product>) => updateDoc(doc(db, 'products', id), data);
export const deleteProduct = (id: string) => deleteDoc(doc(db, 'products', id));


// Onboarding
export const getOnboardings = async (): Promise<Onboarding[]> => {
    const querySnapshot = await getDocs(collection(db, 'onboardings'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Onboarding));
};
export const startOnboarding = async (contact: Contact, product: Product) => {
    const dailyTasks: Onboarding['dailyTasks'] = {};
    for (const day in product.onboardingPlan) {
        dailyTasks[day] = product.onboardingPlan[day].map(text => ({ text, completed: false }));
    }

    const onboardingData: Omit<Onboarding, 'id'> = {
        contactId: contact.id,
        contactName: contact.name,
        productId: product.id,
        productName: product.name,
        status: 'A Fazer',
        dailyTasks,
    };
    return addDoc(collection(db, 'onboardings'), onboardingData);
};
export const updateOnboarding = (id: string, data: Partial<Onboarding>) => updateDoc(doc(db, 'onboardings', id), data);
export const deleteOnboarding = (id: string) => deleteDoc(doc(db, 'onboardings', id));

// Follow-Up
export const addFollowUpFromOnboarding = async (contactId: string, studentUserId: string, productId: string) => {
    const contactSnap = await getDoc(doc(db, 'contacts', contactId));
    const productSnap = await getDoc(doc(db, 'products', productId));

    if (!contactSnap.exists() || !productSnap.exists()) {
        throw new Error("Contato ou Produto não encontrado para criar o acompanhamento.");
    }
    
    const followUpData = {
        studentUserId: studentUserId,
        contactName: contactSnap.data().name,
        productId: productSnap.id,
        productName: productSnap.data().name,
        createdAt: serverTimestamp(),
    };
    return addDoc(collection(db, 'followUps'), followUpData);
}

export const getFollowUps = async (studentId?: string): Promise<FollowUp[]> => {
    let q;
    if (studentId) {
        // Se um ID de estudante for fornecido, busca apenas os dele
        q = query(collection(db, 'followUps'), where('studentUserId', '==', studentId));
    } else {
        // Se não, busca todos (para a visão do operador)
        q = query(collection(db, 'followUps'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FollowUp));
};
export const createFollowUp = (data: Omit<FollowUp, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'followUps'), {
        ...data,
        createdAt: serverTimestamp()
    });
};
export const getStudentsFromContacts = async (): Promise<Contact[]> => {
    const q = query(collection(db, 'contacts'), where('userId', '!=', null));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}
export const deleteFollowUp = (id: string) => deleteDoc(doc(db, 'followUps', id));

// Mentorias
export const getMentorships = (followUpId: string, callback: (data: Mentorship[]) => void) => {
    const q = query(collection(db, `followUps/${followUpId}/mentorships`));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Mentorship));
      callback(data);
    });
};
export const addMentorship = (followUpId: string, data: Omit<Mentorship, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, `followUps/${followUpId}/mentorships`), {
        ...data,
        createdAt: serverTimestamp(),
    });
}


// Plano de Ação
export const getActionPlanTasks = (followUpId: string, callback: (data: ActionPlanTask[]) => void) => {
    const q = query(collection(db, `followUps/${followUpId}/tasks`));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionPlanTask));
      callback(data);
    });
};
export const addActionPlanTask = (followUpId: string, text: string) => {
    return addDoc(collection(db, `followUps/${followUpId}/tasks`), {
        text,
        status: 'pending'
    });
};
export const updateActionPlanTask = (followUpId: string, taskId: string, data: Partial<ActionPlanTask>) => {
    return updateDoc(doc(db, `followUps/${followUpId}/tasks`, taskId), data);
}

// Financeiro - Contas a Pagar/Receber
export const getFinancialAccounts = async (type: FinancialAccountType): Promise<FinancialAccount[]> => {
    const q = query(collection(db, 'financialAccounts'), where('type', '==', type));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
};
export const getPayableAccounts = async (): Promise<FinancialAccount[]> => {
    const q = query(collection(db, 'financialAccounts'), where('type', '==', 'payable'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
}
export const addFinancialAccount = (data: Omit<FinancialAccount, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'financialAccounts'), { ...data, createdAt: serverTimestamp() });
};
export const updateFinancialAccount = (id: string, data: Partial<Omit<FinancialAccount, 'id' | 'createdAt'>>) => {
    return updateDoc(doc(db, 'financialAccounts', id), data);
};
export const deleteFinancialAccount = (id: string) => deleteDoc(doc(db, 'financialAccounts', id));


// Financeiro - Dívidas
export const getFinancialDebts = async (): Promise<FinancialDebt[]> => {
    const querySnapshot = await getDocs(collection(db, "financialDebts"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialDebt));
};
export const addFinancialDebt = (data: Omit<FinancialDebt, 'id'>) => addDoc(collection(db, 'financialDebts'), data);
export const updateFinancialDebt = (id: string, data: Partial<FinancialDebt>) => updateDoc(doc(db, 'financialDebts', id), data);
export const deleteFinancialDebt = (id: string) => deleteDoc(doc(db, 'financialDebts', id));



export interface Campaign {
  id: string;
  name: string;
  contactIds: string[];
  channels: ('email' | 'whatsapp')[];
  emailContent?: {
    subject: string;
    body: string;
  };
  createdAt: any; // Firestore Timestamp
}

export interface Dispatch {
  id: string;
  campaignId: string;
  dispatchDate: any; // Firestore Timestamp
  status: 'success' | 'failed';
  error?: string;
}


export const getCampaigns = async (): Promise<Campaign[]> => {
  const querySnapshot = await getDocs(collection(db, "campaigns"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
}

export const updateCampaign = async (id: string, data: Partial<Omit<Campaign, 'id' | 'createdAt'>>) => {
    return updateDoc(doc(db, 'campaigns', id), data);
}

export const getDispatchesByCampaignId = async (campaignId: string): Promise<Dispatch[]> => {
    const q = query(collection(db, 'dispatches'), where('campaignId', '==', campaignId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dispatchDate: doc.data().dispatchDate.toDate()
    } as Dispatch)).sort((a, b) => b.dispatchDate - a.dispatchDate);
};
