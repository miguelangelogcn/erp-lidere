import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada.");
  }

  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);

  app = !getApps().length
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApp();

} catch (error: any) {
  console.error("❌ ERRO CRÍTICO AO INICIAR O FIREBASE ADMIN:", error.message);
  throw error;
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

// EXPORTAÇÕES CORRETAS (APENAS AS INSTÂNCIAS)
export { app as adminApp, adminAuth, adminDb };