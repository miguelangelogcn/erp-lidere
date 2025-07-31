import * as admin from 'firebase-admin';

// Verifica se a variável de ambiente principal existe
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida.');
}

// Analisa a string JSON da variável de ambiente
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Evita a re-inicialização do app no ambiente de desenvolvimento
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();