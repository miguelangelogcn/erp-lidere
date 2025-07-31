import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app;

// This check is crucial to prevent re-initialization
if (!getApps().length) {
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

      app = initializeApp({ credential: cert(serviceAccount) });

    } catch (error: any) {
      console.error("❌ ERRO CRÍTICO AO INICIAR O FIREBASE ADMIN:", error.message);
      // It's better to let the app crash if the admin SDK can't initialize
      // as many server-side functionalities will depend on it.
      // throw error; 
    }
} else {
    app = getApp();
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
