

import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, orderBy, onSnapshot, writeBatch, documentId, getDoc, setDoc } from "firebase/firestore";
import { app } from "./client";

export const db = getFirestore(app);


// --- TYPE DEFINITIONS ---

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    userId?: string;
}

export interface Company {
    id: string;
    name: string;
    website?: string;
    phone?: string;
}

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
  assignedCourses?: string[];
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
        [day: string]: OnboardingDailyTask[];
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
    submittedText?: string;
    createdAt: any;
}

// Content Module Types
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
    videoUrl?: string; // YouTube or Storage URL
    content: string; // Rich text / Markdown
    attachments: { name: string; url: string }[];
}

// User Progress Type
export interface UserProgress {
    [lessonId: string]: boolean; // { lessonId: true }
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

export const getStudents = async (): Promise<Employee[]> => {
    const roles = await getRoles();
    const studentRole = roles.find(r => r.name.toLowerCase() === 'student');
    if (!studentRole) return [];

    const usersCol = collection(db, "users");
    const q = query(usersCol, where("roleId", "==", studentRole.id));
    const snapshot = await getDocs(q);
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));

    return students.map(student => ({...student, role: studentRole.name}));
}


export const updateEmployee = (id: string, employee: Partial<Employee>) => updateDoc(doc(db, "users", id), employee);
export const deleteEmployee = (id: string) => deleteDoc(doc(db, "users", id));

// Contacts CRUD
export const getContacts = async (): Promise<Contact[]> => {
    const contactsCol = collection(db, "contacts");
    const snapshot = await getDocs(query(contactsCol, orderBy("name")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
};
export const addContact = (contact: Omit<Contact, "id" | "userId">) => addDoc(collection(db, "contacts"), contact);
export const updateContact = (id: string, contact: Partial<Contact>) => updateDoc(doc(db, "contacts", id), contact);
export const deleteContact = (id: string) => deleteDoc(doc(db, "contacts", id));


export const createStudentFromContact = async (contact: Contact, password: string): Promise<void> => {
    try {
        const roles = await getRoles();
        const studentRole = roles.find(r => r.name.toLowerCase() === 'student');
        if (!studentRole) {
            throw new Error("Cargo 'Student' não encontrado. Crie o cargo antes de continuar.");
        }

        // This API call needs to happen in a secure environment.
        // We'll call a Next.js API route that uses the Firebase Admin SDK.
        const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: contact.email, 
                password: password, 
                name: contact.name,
                roleId: studentRole.id 
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Falha ao criar usuário");
        }

        // Update the contact document with the new user's UID
        await updateContact(contact.id, { userId: result.uid });

    } catch (error: any) {
        console.error("Error creating student from contact:", error);
        throw new Error(error.message || 'Falha ao criar o acesso de aluno.');
    }
};


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
    const dealsQuery = query(collection(db, "deals"), where("pipelineId", "==", id));
    const dealsSnapshot = await getDocs(dealsQuery);
    dealsSnapshot.forEach(dealDoc => batch.delete(dealDoc.ref));
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

export const getFollowUps = async (userId?: string): Promise<FollowUp[]> => {
    const followUpsCol = collection(db, "followUps");
    let followUpsQuery;

    if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const contactId = userDoc.exists() ? userDoc.id : null;

        if (!contactId) return [];

        followUpsQuery = query(
            followUpsCol,
            where("contactId", "==", contactId),
            orderBy("createdAt", "desc")
        );
    } else {
        followUpsQuery = query(followUpsCol, orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(followUpsQuery);
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

// Content Module CRUD
// Courses
export const getCourses = async (): Promise<Course[]> => {
    const coursesCol = collection(db, "courses");
    const snapshot = await getDocs(query(coursesCol, orderBy("title")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};
export const getCourse = async (id: string): Promise<Course | null> => {
    const courseDoc = await getDoc(doc(db, "courses", id));
    return courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } as Course : null;
};
export const addCourse = (data: Omit<Course, "id">) => addDoc(collection(db, "courses"), data);
export const updateCourse = (id: string, data: Partial<Course>) => updateDoc(doc(db, "courses", id), data);
export const deleteCourse = (id: string) => deleteDoc(doc(db, "courses", id));
export const getAssignedCourses = async (courseIds: string[]): Promise<Course[]> => {
    if (!courseIds || courseIds.length === 0) return [];
    const coursesCol = collection(db, "courses");
    const q = query(coursesCol, where(documentId(), "in", courseIds));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};

// Modules
export const getModules = async (courseId: string): Promise<Module[]> => {
    const modulesCol = collection(db, `courses/${courseId}/modules`);
    const snapshot = await getDocs(query(modulesCol, orderBy("order")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
};
export const getModule = async (courseId: string, moduleId: string): Promise<Module | null> => {
    const moduleDoc = await getDoc(doc(db, `courses/${courseId}/modules`, moduleId));
    return moduleDoc.exists() ? { id: moduleDoc.id, ...moduleDoc.data() } as Module : null;
};
export const addModule = (courseId: string, data: Omit<Module, "id">) => addDoc(collection(db, `courses/${courseId}/modules`), data);
export const updateModule = (courseId: string, moduleId: string, data: Partial<Module>) => updateDoc(doc(db, `courses/${courseId}/modules`, moduleId), data);
export const deleteModule = (courseId: string, moduleId: string) => deleteDoc(doc(db, `courses/${courseId}/modules`, moduleId));

// Lessons
export const getLessons = async (courseId: string, moduleId: string): Promise<Lesson[]> => {
    const lessonsCol = collection(db, `courses/${courseId}/modules/${moduleId}/lessons`);
    const snapshot = await getDocs(query(lessonsCol, orderBy("order")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
};
export const addLesson = (courseId: string, moduleId: string, data: Omit<Lesson, "id">) => addDoc(collection(db, `courses/${courseId}/modules/${moduleId}/lessons`), data);
export const updateLesson = (courseId: string, moduleId: string, lessonId: string, data: Partial<Lesson>) => updateDoc(doc(db, `courses/${courseId}/modules/${moduleId}/lessons`, lessonId), data);
export const deleteLesson = (courseId: string, moduleId: string, lessonId: string) => deleteDoc(doc(db, `courses/${courseId}/modules/${moduleId}/lessons`, lessonId));

// User Progress
export const getUserProgress = async (userId: string): Promise<UserProgress> => {
    const progressDoc = await getDoc(doc(db, `userProgress/${userId}`));
    if (!progressDoc.exists()) {
        return {};
    }
    const data = progressDoc.data();
    // Filter out any potential non-boolean values if the data is not clean
    const cleanProgress: UserProgress = {};
    for (const key in data) {
        if (typeof data[key] === 'boolean') {
            cleanProgress[key] = data[key];
        }
    }
    return cleanProgress;
};

export const updateUserProgress = async (userId: string, lessonId: string, completed: boolean) => {
    const progressRef = doc(db, `userProgress/${userId}`);
    return setDoc(progressRef, { [lessonId]: completed }, { merge: true });
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
