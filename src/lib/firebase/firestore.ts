import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
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
  role?: string; // Optional: To be populated after fetching
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

// Employees CRUD
export const getEmployees = async (): Promise<Employee[]> => {
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("role", "==", "employee"));
    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    
    // This part is inefficient on large datasets, consider denormalization for production apps
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
