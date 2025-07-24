import { NextResponse } from 'next/server';

export async function GET() {
  console.log("HEALTH CHECK: Rota de verificação iniciada.");
  try {
    console.log("HEALTH CHECK: Tentando importar dinamicamente o Firebase Admin...");
    // Importa o módulo do servidor dinamicamente para capturar erros de inicialização.
    const { adminDb } = await import('@/lib/firebase/server');
    console.log("HEALTH CHECK: Firebase Admin importado com sucesso.");

    console.log("HEALTH CHECK: Tentando listar coleções do Firestore...");
    // Tenta uma operação simples para verificar a conexão e permissões.
    const collections = await adminDb.listCollections();
    console.log(`HEALTH CHECK: Sucesso! Encontradas ${collections.length} coleções.`);

    // Se tudo funcionou, retorna um status de sucesso.
    return NextResponse.json({ status: 'ok', collectionsCount: collections.length });

  } catch (error: any) {
    // Se qualquer parte falhar, captura o erro.
    console.error("❌ ERRO GRAVE NO HEALTH CHECK:", error);
    
    // Retorna uma resposta de erro detalhada.
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Falha na inicialização ou conexão com o Firebase Admin.',
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code, // Pode ser útil para erros específicos do Firebase
      }, 
      { status: 500 }
    );
  }
}
