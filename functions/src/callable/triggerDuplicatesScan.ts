// Em functions/src/callable/triggerDuplicatesScan.ts
import { onCall } from "firebase-functions/v2/https";
import { analyzeAndReportDuplicates } from "../lib/duplicatesHelper";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";

export const triggerDuplicatesScan = onCall(async (request) => {
  // Verifica se o usuário está autenticado
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para executar esta ação.'
    );
  }
  
  logger.info(`Varredura de duplicatas acionada manualmente pelo usuário: ${request.auth.uid}`);
  
  try {
    await analyzeAndReportDuplicates();
    return { success: true, message: "Varredura de duplicatas concluída com sucesso." };
  } catch (error) {
    logger.error("Erro ao executar a varredura manual de duplicatas:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Ocorreu um erro ao processar a solicitação.'
    );
  }
});
