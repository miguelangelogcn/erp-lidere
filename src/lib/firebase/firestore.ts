import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, orderBy, onSnapshot, writeBatch } from "firebase/firestore";
import { app } from "./client";

const db = getFirestore(app);

// General Types
export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

export interface Company {
    id: string;
    name: string;
    website?: string;
    phone?: string;
}

// User Management Types
export interface Role {
  id: string;
  name: string;
  permissions: {
    [key: string]: boolean;
  };
}

export interface Employee {
  id: string; // This is the Firebase Auth UID
  name: string;
  email: string;
  roleId: string;
  role?: string; // Populated after fetching
}

// Sales Module Types
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
    contactName?: string;
    ownerId: string;
    ownerName?: string;
}

export interface Note {
    id: string;
    content: string;
    author: string;
    createdAt: any;
}

// Operations Module Types
export interface OnboardingPlan {
    [day: string]: string[]; // e.g., { D0: ["Task 1", "Task 2"], D1: [...] }
}

export interface Product {
    id: string;
    name: string;
    value: number;
    onboardingPlan: OnboardingPlan;
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
    status: "A Fazer" | "Fazendo" | "Feito";
    dailyTasks: {
        [day: string]: OnboardingDailyTask[]; // e.g., { D0: [{text: "T1", completed: false}], D1: [...] }
    };
    createdAt: any;
}

export interface FollowUp {
    id: string;
    contactId: string;
    contactName: string;
    productId: string;
    productName: string;
    createdAt: any;
}

export interface Mentorship {
    id: string;
    videoUrl: string;
    transcript: string;
    attachments: { name: string; url: string }[];
    createdAt: any;
}

export interface ActionPlanTask {
    id: string;
    text: string;
    status: 'pending' | 'completed' | 'validated';
    submittedFileUrl?: string;
    createdAt: any;
}

// --- SERVICE FUNCTIONS ---

// Roles CRUD
export const getRoles = async (): Promise<Role[]> => {
  const rolesCol = collection(db, "roles");
  const snapshot = await getDocs(rolesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};
export const addRole = (role: Omit<Role, "id">) => addDoc(collection(db, "roles"), role);
export const updateRole = (id: string, role: Partial<Role>) => updateDoc(doc(db, "roles", id), role);
export const deleteRole = (id: string) => deleteDoc(doc(db, "roles", id));

// Employees (Users) CRUD
export const getEmployees = async (): Promise<Employee[]> => {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    
    const roles = await getRoles();
    const rolesMap = new Map(roles.map(r => [r.id, r.name]));

    return employees.map(emp => ({
        ...emp,
        role: emp.roleId ? rolesMap.get(emp.roleId) || 'N/A' : 'N/A'
    }));
};
// Note: addEmployee is a server-side action due to auth creation.
export const updateEmployee = (id: string, employee: Partial<{name: string, roleId: string}>) => updateDoc(doc(db, "users", id), employee);
export const deleteEmployee = (id: string) => deleteDoc(doc(db, "users", id)); // Consider soft-delete for production

// Contacts CRUD
export const getContacts = async (): Promise<Contact[]> => {
    const contactsCol = collection(db, "contacts");
    const snapshot = await getDocs(contactsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
};
export const addContact = (contact: Omit<Contact, "id">) => addDoc(collection(db, "contacts"), contact);
export const updateContact = (id: string, contact: Partial<Contact>) => updateDoc(doc(db, "contacts", id), contact);
export const deleteContact = (id: string) => deleteDoc(doc(db, "contacts", id));

// Companies CRUD
export const getCompanies = async (): Promise<Company[]> => {
    const companiesCol = collection(db, "companies");
    const snapshot = await getDocs(companiesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
};
export const addCompany = (company: Omit<Company, "id">) => addDoc(collection(db, "companies"), company);
export const updateCompany = (id: string, company: Partial<Company>) => updateDoc(doc(db, "companies", id), company);
export const deleteCompany = (id: string) => deleteDoc(doc(db, "companies", id));

// Pipelines CRUD
export const getPipelines = async (): Promise<Pipeline[]> => {
    const pipelinesCol = collection(db, "pipelines");
    const snapshot = await getDocs(query(pipelinesCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pipeline));
};
export const addPipeline = (pipeline: Omit<Pipeline, "id">) => addDoc(collection(db, "pipelines"), pipeline);
export const updatePipeline = (id: string, pipeline: Partial<Pipeline>) => updateDoc(doc(db, "pipelines", id), pipeline);
export const deletePipeline = async (id: string) => {
    const batch = writeBatch(db);
    // Delete deals in pipeline
    const dealsQuery = query(collection(db, "deals"), where("pipelineId", "==", id));
    const dealsSnapshot = await getDocs(dealsQuery);
    dealsSnapshot.forEach(dealDoc => batch.delete(dealDoc.ref));
    // Delete pipeline itself
    batch.delete(doc(db, "pipelines", id));
    await batch.commit();
};

// Deals CRUD
export const getDealsByPipeline = async (pipelineId: string): Promise<Deal[]> => {
    if (!pipelineId) return [];
    const dealsCol = collection(db, "deals");
    const q = query(dealsCol, where("pipelineId", "==", pipelineId));
    const snapshot = await getDocs(q);
    const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));

    const [contacts, employees] = await Promise.all([getContacts(), getEmployees()]);
    const contactsMap = new Map(contacts.map(c => [c.id, c.name]));
    const employeesMap = new Map(employees.map(e => [e.id, e.name]));

    return deals.map(deal => ({
        ...deal,
        contactName: contactsMap.get(deal.contactId) || 'N/A',
        ownerName: employeesMap.get(deal.ownerId) || 'N/A'
    }));
};
export const addDeal = (deal: Omit<Deal, "id">) => addDoc(collection(db, "deals"), deal);
export const updateDeal = (id: string, deal: Partial<Deal>) => updateDoc(doc(db, "deals", id), deal);
export const deleteDeal = (id: string) => deleteDoc(doc(db, "deals", id));

// Notes CRUD (Subcollection)
export const getNotes = (dealId: string, callback: (notes: Note[]) => void) => {
    const notesCol = collection(db, "deals", dealId, "notes");
    const q = query(notesCol, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() } as Note));
        callback(notes);
    });
};
export const addNote = (dealId: string, note: { content: string, author: string }) => {
    const notesCol = collection(db, "deals", dealId, "notes");
    return addDoc(notesCol, { ...note, createdAt: serverTimestamp() });
};

// Products CRUD
export const getProducts = async (): Promise<Product[]> => {
    const productsCol = collection(db, "products");
    const snapshot = await getDocs(query(productsCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};
export const addProduct = (product: Omit<Product, "id">) => addDoc(collection(db, "products"), product);
export const updateProduct = (id: string, product: Partial<Product>) => updateDoc(doc(db, "products", id), product);
export const deleteProduct = (id: string) => deleteDoc(doc(db, "products", id));

// Onboardings CRUD
export const getOnboardings = async (): Promise<Onboarding[]> => {
    const onboardingsCol = collection(db, "onboardings");
    const snapshot = await getDocs(query(onboardingsCol, orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Onboarding));
};
export const startOnboarding = async (contact: Contact, product: Product) => {
    const dailyTasks: Onboarding['dailyTasks'] = {};
    for (const day in product.onboardingPlan) {
        dailyTasks[day] = product.onboardingPlan[day].map(taskText => ({ text: taskText, completed: false }));
    }

    const newOnboarding: Omit<Onboarding, "id"> = {
        contactId: contact.id,
        contactName: contact.name,
        productId: product.id,
        productName: product.name,
        status: "A Fazer",
        dailyTasks,
        createdAt: serverTimestamp(),
    };
    return addDoc(collection(db, "onboardings"), newOnboarding);
};
export const updateOnboarding = (id: string, data: Partial<Onboarding>) => updateDoc(doc(db, "onboardings", id), data);

// Follow-ups
export const addFollowUp = async (onboarding: Onboarding) => {
    const newFollowUp: Omit<FollowUp, "id"> = {
        contactId: onboarding.contactId,
        contactName: onboarding.contactName,
        productId: onboarding.productId,
        productName: onboarding.productName,
        createdAt: serverTimestamp(),
    };
    return addDoc(collection(db, "followUps"), newFollowUp);
};
export const getFollowUps = async (): Promise<FollowUp[]> => {
    const followUpsCol = collection(db, "followUps");
    const snapshot = await getDocs(query(followUpsCol, orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FollowUp));
};

// Follow-up Subcollections
export const getMentorships = (followUpId: string, callback: (data: Mentorship[]) => void) => {
    const mentorshipsCol = collection(db, "followUps", followUpId, "mentorships");
    const q = query(mentorshipsCol, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() } as Mentorship));
        callback(data);
    });
};
export const addMentorship = (followUpId: string, data: Omit<Mentorship, "id" | "createdAt">) => {
    return addDoc(collection(db, "followUps", followUpId, "mentorships"), { ...data, createdAt: serverTimestamp() });
};

export const getActionPlanTasks = (followUpId: string, callback: (data: ActionPlanTask[]) => void) => {
    const tasksCol = collection(db, "followUps", followUpId, "actionPlanTasks");
    const q = query(tasksCol, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() } as ActionPlanTask));
        callback(data);
    });
};
export const addActionPlanTask = (followUpId: string, text: string) => {
    return addDoc(collection(db, "followUps", followUpId, "actionPlanTasks"), {
        text,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
};
export const updateActionPlanTask = (followUpId: string, taskId: string, data: Partial<ActionPlanTask>) => {
    return updateDoc(doc(db, "followUps", followUpId, "actionPlanTasks", taskId), data);
};

// System Pages for Permissions
export const systemPages = [
    { id: "dashboard", label: "Dashboard" },
    { id: "gestao", label: "Gestão" },
    { id: "gestao/funcionarios", label: "Funcionários (Gestão)" },
    { id: "gestao/cargos", label: "Cargos (Gestão)" },
    { id: "conteudo", label: "Conteúdo" },
    { id: "operacoes", label: "Operações" },
    { id: "financeiro", label: "Financeiro" },
    { id: "vendas", label: "Vendas" },
];
