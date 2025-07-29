// Importe e re-exporte todas as suas Cloud Functions aqui.

// Importa a nova função do arquivo de jobs.
// Certifique-se de que o caminho './jobs/findDuplicates' está correto.
import { findDuplicateContacts } from './jobs/findDuplicates';

// Exporta a função para que o Firebase possa descobri-la.
export { findDuplicateContacts };
