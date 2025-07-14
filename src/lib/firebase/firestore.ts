import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "./client";

const db = getFirestore(app);

// Types
export interface Role {
  id: string;
  name: string;
  permissions: {
    [key: string]: boolean;
  };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: string; // Populated after fetching
}

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

// Roles CRUD
export const getRoles = async (): Promise<Role[]> => {
  const rolesCol = collection(db, "roles");
  const snapshot = await getDocs(rolesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
};

export const addRole = async (role: Omit<Role, "id">) => {
  const rolesCol = collection(db, "roles");
  const docRef = await addDoc(rolesCol, role);
  return docRef.id;
};

export const updateRole = async (id: string, role: Partial<Role>) => {
  const roleDoc = doc(db, "roles", id);
  await updateDoc(roleDoc, role);
};

export const deleteRole = async (id: string) => {
  const roleDoc = doc(db, "roles", id);
  await deleteDoc(roleDoc);
};

// Employees (Users)
export const getEmployees = async (): Promise<Employee[]> => {
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("role", "==", "employee"));
    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    
    const roles = await getRoles();
    const rolesMap = new Map(roles.map(r => [r.id, r.name]));

    return employees.map(emp => ({
        ...emp,
        role: emp.roleId ? rolesMap.get(emp.roleId) || 'N/A' : 'N/A'
    }));
};

export const addEmployee = async (employee: { name: string; email: string; roleId: string; }) => {
  const usersCol = collection(db, "users");
  const docRef = await addDoc(usersCol, { ...employee, role: 'employee' });
  return docRef.id;
};

export const updateEmployee = async (id: string, employee: Partial<{name: string, email: string, roleId: string}>) => {
  const employeeDoc = doc(db, "users", id);
  await updateDoc(employeeDoc, employee);
};

export const deleteEmployee = async (id: string) => {
  const employeeDoc = doc(db, "users", id);
  await deleteDoc(employeeDoc);
};

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
    const snapshot = await getDocs(pipelinesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pipeline));
};
export const addPipeline = (pipeline: Omit<Pipeline, "id">) => addDoc(collection(db, "pipelines"), pipeline);
export const updatePipeline = (id: string, pipeline: Partial<Pipeline>) => updateDoc(doc(db, "pipelines", id), pipeline);
export const deletePipeline = (id: string) => deleteDoc(doc(db, "pipelines", id));

// Deals CRUD
export const getDealsByPipeline = async (pipelineId: string): Promise<Deal[]> => {
    if (!pipelineId) return [];
    const dealsCol = collection(db, "deals");
    const q = query(dealsCol, where("pipelineId", "==", pipelineId));
    const snapshot = await getDocs(q);
    const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));

    const contacts = await getContacts();
    const contactsMap = new Map(contacts.map(c => [c.id, c.name]));
    const employees = await getEmployees();
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
