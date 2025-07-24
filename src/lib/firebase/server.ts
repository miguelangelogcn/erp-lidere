import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app;

try {
  // Pega a chave do ambiente
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // Verifica se a chave existe
  if (!serviceAccountKey) {
    throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada. Verifique seu arquivo .env.local.");
  }

  // Tenta converter a chave para JSON
  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);

  console.log("✔️ Credenciais do Firebase encontradas. Inicializando o Admin SDK...");

  // Inicializa o Firebase Admin SDK
  app = !getApps().length
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApp();

  console.log("✔️ Conexão com o Firebase estabelecida com sucesso!");

} catch (error: any) {
  // Se qualquer passo acima falhar, exibe um erro claro no terminal
  console.error("❌ ERRO CRÍTICO AO INICIAR O FIREBASE ADMIN:", error.message);
  // Lança o erro para que o Next.js saiba que a inicialização falhou
  throw error;
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { app as adminApp, adminAuth, adminDb };