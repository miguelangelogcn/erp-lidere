import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch } from "firebase-admin/firestore";

let app;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada.");
  }

  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);

  // Corrige o formato da chave privada, substituindo '\\n' por '\n'
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  app = !getApps().length
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApp();

} catch (error: any) {
  console.error("❌ ERRO CRÍTICO AO INICIAR O FIREBASE ADMIN:", error.message);
  // Não relançar o erro aqui para permitir que a aplicação continue funcionando,
  // mas o health check irá falhar.
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

// EXPORTAÇÕES CORRETAS (APENAS AS INSTÂNCIAS)
export { app as adminApp, adminAuth, adminDb, collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch };
