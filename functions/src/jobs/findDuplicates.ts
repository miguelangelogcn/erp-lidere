import { onSchedule } from "firebase-functions/v2/scheduler";
import { analyzeAndReportDuplicates } from "../lib/duplicatesHelper";

/**
 * Cloud Function agendada para rodar a cada 24 horas e iniciar
 * o processo de análise de contatos duplicados.
 */
export const findDuplicateContacts = onSchedule("every 24 hours", async (event) => {
  await analyzeAndReportDuplicates();
});
