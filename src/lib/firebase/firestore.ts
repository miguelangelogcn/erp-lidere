
// src/lib/firebase/firestore.ts

import { collection, getDocs, doc, updateDoc, getDoc, query, where, addDoc, serverTimestamp, deleteDoc, onSnapshot, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "./client"; // Importa a conexão correta do cliente
import { deleteUser } from "firebase/auth";

// Common Interfaces

export interface Role {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    roleId: string;
    role?: string; // Optional: To be populated after fetching
    assignedCourses?: string[];
}

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

export interface UserProgress {
    [lessonId: string]: boolean;
}

export interface Product {
    id: string;
    name: string;
    value: number;
    onboardingPlan: {
        [day: string]: string[];
    }
}

export interface Onboarding {
    id: string;
    contactId: string;
    contactName: string;
    productId: string;
    productName: string;
    status: 'A Fazer' | 'Fazendo' | 'Feito';
    dailyTasks: {
        [day: string]: OnboardingDailyTask[];
    }
}

export interface OnboardingDailyTask {
    text: string;
    completed: boolean;
}

export interface FollowUp {
    id: string;
    studentUserId: string;
    contactName: string;
    productId: string;
    productName: string;
    createdAt: Timestamp;
}

export interface Mentorship {
    id: string;
    videoUrl: string;
    transcript: string;
    attachments: { name: string, url: string }[];
    createdAt: number;
}

export interface ActionPlanTask {
  id: string;
  text: string;
  status: 'pending' | 'completed' | 'validated';
  submittedText?: string;
  submittedFileUrl?: string;
}


// Shared pages for roles
export const systemPages = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'gestao', label: 'Gestão' },
    { id: 'conteudo', label: 'Conteúdo' },
    { id: 'operacoes', label: 'Operações' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'vendas', label: 'Vendas' },
];

// Firestore Service Functions

// Roles
export async function getRoles(): Promise<Role[]> {
    const rolesCol = collection(db, "roles");
    const querySnapshot = await getDocs(rolesCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
}

export async function addRole(data: Omit<Role, 'id'>) {
    await addDoc(collection(db, "roles"), data);
}

export async function updateRole(id: string, data: Partial<Role>) {
    const roleRef = doc(db, "roles", id);
    await updateDoc(roleRef, data);
}

export async function deleteRole(id: string) {
    const roleRef = doc(db, "roles", id);
    await deleteDoc(roleRef);
}


// Employees
export async function getEmployees(): Promise<Employee[]> {
    const employeesCol = collection(db, "users");
    const roles = await getRoles();
    const rolesMap = new Map(roles.map(r => [r.id, r.name]));

    const querySnapshot = await getDocs(employeesCol);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id,
            ...data,
            role: rolesMap.get(data.roleId) || 'N/A', // Populate role name
        } as Employee
    });
}

export async function getStudents(): Promise<Employee[]> {
    const allEmployees = await getEmployees();
    return allEmployees.filter(e => e.role?.toLowerCase() === 'student');
}

export async function updateEmployee(id: string, data: Partial<Employee>) {
    const employeeRef = doc(db, "users", id);
    await updateDoc(employeeRef, data);
}

export async function deleteEmployee(id: string) {
    // This is a simplified version. In a real app, you'd call a Cloud Function
    // to delete the user from Firebase Auth as well.
    const employeeRef = doc(db, "users", id);
    await deleteDoc(employeeRef);
}


// Courses
export async function getCourses(): Promise<Course[]> {
    const coursesCol = collection(db, "courses");
    const querySnapshot = await getDocs(coursesCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
}
export async function getAssignedCourses(courseIds: string[]): Promise<Course[]> {
  if (courseIds.length === 0) return [];
  const coursesCol = collection(db, "courses");
  const q = query(coursesCol, where('__name__', 'in', courseIds));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
}

export async function getCourse(id: string): Promise<Course | null> {
    const courseRef = doc(db, 'courses', id);
    const courseSnap = await getDoc(courseRef);
    return courseSnap.exists() ? { id: courseSnap.id, ...courseSnap.data() } as Course : null;
}
export async function addCourse(data: Omit<Course, 'id'>) {
    await addDoc(collection(db, "courses"), data);
}
export async function updateCourse(id: string, data: Partial<Course>) {
    const courseRef = doc(db, "courses", id);
    await updateDoc(courseRef, data);
}
export async function deleteCourse(id: string) {
    const courseRef = doc(db, "courses", id);
    await deleteDoc(courseRef);
}

// Modules
export async function getModules(courseId: string): Promise<Module[]> {
    const modulesCol = collection(db, "courses", courseId, "modules");
    const querySnapshot = await getDocs(modulesCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module)).sort((a,b) => a.order - b.order);
}
export async function getModule(courseId: string, moduleId: string): Promise<Module | null> {
    const moduleRef = doc(db, "courses", courseId, "modules", moduleId);
    const docSnap = await getDoc(moduleRef);
    return docSnap.exists() ? {id: docSnap.id, ...docSnap.data()} as Module : null;
}
export async function addModule(courseId: string, data: Omit<Module, 'id'>) {
    await addDoc(collection(db, "courses", courseId, "modules"), data);
}
export async function updateModule(courseId: string, moduleId: string, data: Partial<Module>) {
    const moduleRef = doc(db, "courses", courseId, "modules", moduleId);
    await updateDoc(moduleRef, data);
}
export async function deleteModule(courseId: string, moduleId: string) {
    const moduleRef = doc(db, "courses", courseId, "modules", moduleId);
    await deleteDoc(moduleRef);
}

// Lessons
export async function getLessons(courseId: string, moduleId: string): Promise<Lesson[]> {
    const lessonsCol = collection(db, "courses", courseId, "modules", moduleId, "lessons");
    const querySnapshot = await getDocs(lessonsCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)).sort((a,b) => a.order - b.order);
}
export async function addLesson(courseId: string, moduleId: string, data: Omit<Lesson, 'id'>) {
    await addDoc(collection(db, "courses", courseId, "modules", moduleId, "lessons"), data);
}
export async function updateLesson(courseId: string, moduleId: string, lessonId: string, data: Partial<Lesson>) {
    const lessonRef = doc(db, "courses", courseId, "modules", moduleId, "lessons", lessonId);
    await updateDoc(lessonRef, data);
}
export async function deleteLesson(courseId: string, moduleId: string, lessonId: string) {
    const lessonRef = doc(db, "courses", courseId, "modules", moduleId, "lessons", lessonId);
    await deleteDoc(lessonRef);
}


// User Progress
export async function getUserProgress(userId: string): Promise<UserProgress> {
    const progressRef = doc(db, 'progress', userId);
    const docSnap = await getDoc(progressRef);
    return docSnap.exists() ? docSnap.data() as UserProgress : {};
}

export async function updateUserProgress(userId: string, lessonId: string, completed: boolean) {
    const progressRef = doc(db, 'progress', userId);
    await updateDoc(progressRef, { [lessonId]: completed }, { merge: true });
}

// Products
export async function getProducts(): Promise<Product[]> {
    const productsCol = collection(db, "products");
    const querySnapshot = await getDocs(productsCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}
export async function addProduct(data: Omit<Product, 'id'>) {
    await addDoc(collection(db, "products"), data);
}
export async function updateProduct(id: string, data: Partial<Product>) {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, data);
}
export async function deleteProduct(id: string) {
    const productRef = doc(db, "products", id);
    await deleteDoc(productRef);
}


// Onboarding
export async function getOnboardings(): Promise<Onboarding[]> {
    const onboardingsCol = collection(db, "onboardings");
    const querySnapshot = await getDocs(onboardingsCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Onboarding));
}

export async function startOnboarding(contact: Contact, product: Product) {
    const dailyTasks: Onboarding['dailyTasks'] = {};
    for (const day in product.onboardingPlan) {
        dailyTasks[day] = product.onboardingPlan[day].map(text => ({ text, completed: false }));
    }

    const newOnboarding: Omit<Onboarding, 'id'> = {
        contactId: contact.id,
        contactName: contact.name,
        productId: product.id,
        productName: product.name,
        status: 'A Fazer',
        dailyTasks,
    }
    await addDoc(collection(db, 'onboardings'), newOnboarding);
}

export async function updateOnboarding(id: string, data: Partial<Onboarding>) {
    const onboardingRef = doc(db, "onboardings", id);
    await updateDoc(onboardingRef, data);
}

export async function deleteOnboarding(id: string) {
    const onboardingRef = doc(db, "onboardings", id);
    await deleteDoc(onboardingRef);
}


// Follow Ups
export async function createFollowUp(data: Omit<FollowUp, 'id' | 'createdAt'>) {
    await addDoc(collection(db, "followUps"), {
        ...data,
        createdAt: serverTimestamp()
    });
}
export async function addFollowUpFromOnboarding(contactId: string, studentUserId: string, productId: string) {
    const contactRef = doc(db, 'contacts', contactId);
    const productRef = doc(db, 'products', productId);
    const [contactSnap, productSnap] = await Promise.all([getDoc(contactRef), getDoc(productRef)]);

    if (!contactSnap.exists() || !productSnap.exists()) {
        throw new Error("Contato ou produto não encontrado.");
    }
    
    await createFollowUp({
        studentUserId: studentUserId,
        contactName: contactSnap.data().name,
        productId: productSnap.id,
        productName: productSnap.data().name,
    })
}
export async function getFollowUps(studentId?: string): Promise<FollowUp[]> {
    let q;
    if (studentId) {
        q = query(collection(db, "followUps"), where("studentUserId", "==", studentId));
    } else {
        q = collection(db, "followUps");
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FollowUp)).sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function deleteFollowUp(id: string) {
    const followUpRef = doc(db, "followUps", id);
    await deleteDoc(followUpRef);
}

// Mentorships
export function getMentorships(followUpId: string, callback: (mentorships: Mentorship[]) => void): () => void {
    const mentorshipsCol = collection(db, "followUps", followUpId, "mentorships");
    const q = query(mentorshipsCol);
    return onSnapshot(q, (querySnapshot) => {
        const mentorships = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toMillis()
        } as Mentorship)).sort((a,b) => b.createdAt - a.createdAt);
        callback(mentorships);
    });
}
export async function addMentorship(followUpId: string, data: Omit<Mentorship, 'id' | 'createdAt'>) {
    await addDoc(collection(db, "followUps", followUpId, "mentorships"), { ...data, createdAt: serverTimestamp() });
}

// Action Plan
export function getActionPlanTasks(followUpId: string, callback: (tasks: ActionPlanTask[]) => void): () => void {
    const tasksCol = collection(db, "followUps", followUpId, "actionPlanTasks");
    const q = query(tasksCol);
    return onSnapshot(q, (querySnapshot) => {
        const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionPlanTask));
        callback(tasks);
    });
}
export async function addActionPlanTask(followUpId: string, text: string) {
    await addDoc(collection(db, "followUps", followUpId, "actionPlanTasks"), {
        text,
        status: 'pending'
    });
}
export async function updateActionPlanTask(followUpId: string, taskId: string, data: Partial<ActionPlanTask>) {
    const taskRef = doc(db, "followUps", followUpId, "actionPlanTasks", taskId);
    await updateDoc(taskRef, data);
}

// Contacts
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userId?: string;
  tags?: string[];
}
export async function getContacts(): Promise<Contact[]> {
  const contactsCol = collection(db, "contacts");
  const querySnapshot = await getDocs(contactsCol);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}
export async function getStudentsFromContacts(): Promise<Contact[]> {
    const q = query(collection(db, 'contacts'), where('userId', '!=', null));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}
export async function addContact(data: Omit<Contact, 'id' | 'userId' | 'tags'> & { tags?: string[] }) {
    await addDoc(collection(db, "contacts"), {
        ...data,
        tags: data.tags || []
    });
}
export async function updateContact(id: string, data: Partial<Contact>) {
    const contactRef = doc(db, "contacts", id);
    await updateDoc(contactRef, data);
}
export async function deleteContact(id: string) {
    const contactRef = doc(db, "contacts", id);
    await deleteDoc(contactRef);
}
export async function createStudentFromContact(contact: Contact, password: string) {
    // This function would be in a real app a Cloud Function that:
    // 1. Creates a user in Firebase Auth
    // 2. Gets the new user's UID
    // 3. Updates the contact document with the userId
    // For now, we simulate this via a client-callable API route
    const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: contact.email, 
            password: password, 
            name: contact.name,
            roleId: 'student' // Assuming 'student' role ID is known
        }),
    });
    const result = await response.json();
    if(!response.ok) {
        throw new Error(result.error || 'Failed to create student');
    }

    // Now update the contact with the new UID
    await updateContact(contact.id, { userId: result.uid });
}



// Companies
export interface Company {
    id: string;
    name: string;
    website?: string;
    phone?: string;
}
export async function getCompanies(): Promise<Company[]> {
  const companiesCol = collection(db, "companies");
  const querySnapshot = await getDocs(companiesCol);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
}
export async function addCompany(data: Omit<Company, 'id'>) {
    await addDoc(collection(db, "companies"), data);
}
export async function updateCompany(id: string, data: Partial<Company>) {
    const companyRef = doc(db, "companies", id);
    await updateDoc(companyRef, data);
}
export async function deleteCompany(id: string) {
    const companyRef = doc(db, "companies", id);
    await deleteDoc(companyRef);
}

// Pipelines
export interface Pipeline {
    id: string;
    name: string;
    stages: string[];
}
export async function getPipelines(): Promise<Pipeline[]> {
  const pipelinesCol = collection(db, "pipelines");
  const querySnapshot = await getDocs(pipelinesCol);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pipeline));
}
export async function addPipeline(data: Omit<Pipeline, 'id'>) {
    await addDoc(collection(db, "pipelines"), data);
}
export async function updatePipeline(id: string, data: Partial<Pipeline>) {
    const pipelineRef = doc(db, "pipelines", id);
    await updateDoc(pipelineRef, data);
}
export async function deletePipeline(id: string) {
    const pipelineRef = doc(db, "pipelines", id);
    await deleteDoc(pipelineRef);
}

// Deals
export interface Deal {
    id: string;
    title: string;
    value: number;
    pipelineId: string;
    stage: string;
    contactId: string;
    ownerId: string;
    contactName?: string;
    ownerName?: string;
}
export async function getDealsByPipeline(pipelineId: string): Promise<Deal[]> {
    const dealsQuery = query(collection(db, 'deals'), where('pipelineId', '==', pipelineId));
    const querySnapshot = await getDocs(dealsQuery);
    
    // For performance, fetch all contacts and employees once
    const [contacts, employees] = await Promise.all([getContacts(), getEmployees()]);
    const contactsMap = new Map(contacts.map(c => [c.id, c.name]));
    const employeesMap = new Map(employees.map(e => [e.id, e.name]));

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            contactName: contactsMap.get(data.contactId) || 'N/A',
            ownerName: employeesMap.get(data.ownerId) || 'N/A',
        } as Deal;
    });
}
export async function getAllDeals(): Promise<Deal[]> {
    const dealsCol = collection(db, "deals");
    const querySnapshot = await getDocs(dealsCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
}

export async function addDeal(data: Omit<Deal, 'id'>) {
    await addDoc(collection(db, "deals"), data);
}
export async function updateDeal(id: string, data: Partial<Deal>) {
    const dealRef = doc(db, "deals", id);
    await updateDoc(dealRef, data);
}
export async function deleteDeal(id: string) {
    const dealRef = doc(db, "deals", id);
    await deleteDoc(dealRef);
}

// Notes
export interface Note {
    id: string;
    content: string;
    author: string;
    createdAt: number;
}
export async function addNote(dealId: string, data: Omit<Note, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'deals', dealId, 'notes'), {
        ...data,
        createdAt: serverTimestamp()
    });
}
export function getNotes(dealId: string, callback: (notes: Note[]) => void): () => void {
    const notesCol = collection(db, "deals", dealId, "notes");
    const q = query(notesCol);
    return onSnapshot(q, (querySnapshot) => {
        const notes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toMillis()
        } as Note)).sort((a,b) => b.createdAt - a.createdAt);
        callback(notes);
    });
}


// Financial
export type FinancialAccountType = "receivable" | "payable";
export type RecurrenceType = 'none' | 'weekly' | 'monthly' | 'yearly';
export interface FinancialAccount {
    id: string;
    description: string;
    value: number;
    dueDate: Timestamp;
    category: string;
    recurrence: RecurrenceType;
    type: FinancialAccountType;
    createdAt: Timestamp;
}
export interface FinancialDebt {
    id: string;
    name: string;
    creditor: string;
    totalValue: number;
    interestRate: string; // e.g., "1.5% a.m."
}

export async function getFinancialAccounts(type: FinancialAccountType): Promise<FinancialAccount[]> {
    const q = query(collection(db, 'financialAccounts'), where('type', '==', type));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
}
export async function getPayableAccounts(): Promise<FinancialAccount[]> {
    const q = query(collection(db, 'financialAccounts'), where('type', '==', 'payable'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
}
export async function addFinancialAccount(data: Omit<FinancialAccount, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'financialAccounts'), { ...data, createdAt: serverTimestamp() });
}
export async function updateFinancialAccount(id: string, data: Partial<FinancialAccount>) {
    const accountRef = doc(db, 'financialAccounts', id);
    await updateDoc(accountRef, data);
}
export async function deleteFinancialAccount(id: string) {
    const accountRef = doc(db, 'financialAccounts', id);
    await deleteDoc(accountRef);
}
export async function getFinancialDebts(): Promise<FinancialDebt[]> {
    const debtsCol = collection(db, "financialDebts");
    const querySnapshot = await getDocs(debtsCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialDebt));
}
export async function addFinancialDebt(data: Omit<FinancialDebt, 'id'>) {
    await addDoc(collection(db, "financialDebts"), data);
}
export async function updateFinancialDebt(id: string, data: Partial<FinancialDebt>) {
    const debtRef = doc(db, "financialDebts", id);
    await updateDoc(debtRef, data);
}
export async function deleteFinancialDebt(id: string) {
    const debtRef = doc(db, "financialDebts", id);
    await deleteDoc(debtRef);
}


// Marketing
export interface Campaign {
  id: string;
  name: string;
  contactIds?: string[];
  segmentType: 'individual' | 'tags';
  targetTags?: string[];
  channels: ('email' | 'whatsapp')[];
  emailContent?: {
    subject: string;
    body: string;
  };
  createdAt: any;
  whatsappContent?: {
      templateName: string;
  }
}

export interface Dispatch {
  id: string;
  campaignId: string;
  dispatchDate: any;
  status: 'success' | 'failed';
  error?: string;
}

export async function getCampaigns(): Promise<Campaign[]> {
  const campaignsCol = collection(db, "campaigns");
  const querySnapshot = await getDocs(campaignsCol);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
}

export async function updateCampaign(campaignId: string, data: Partial<Omit<Campaign, 'id' | 'createdAt'>>) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    await updateDoc(campaignRef, data);
}

export async function getDispatchesByCampaignId(campaignId: string): Promise<Dispatch[]> {
    const q = query(collection(db, 'dispatches'), where('campaignId', '==', campaignId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dispatchDate: doc.data().dispatchDate.toDate()
    } as Dispatch)).sort((a,b) => b.dispatchDate - a.dispatchDate);
}

export async function getAllTags(): Promise<string[]> {
    const contactsSnapshot = await getDocs(collection(db, 'contacts'));
    const allTags = new Set<string>();
    contactsSnapshot.forEach(doc => {
        const contact = doc.data() as Contact;
        if (contact.tags && Array.isArray(contact.tags)) {
            contact.tags.forEach(tag => allTags.add(tag));
        }
    });
    return Array.from(allTags).sort();
}
    

