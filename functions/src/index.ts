// Este arquivo agora apenas importa e exporta suas funções,
// sem nenhuma lógica própria, resolvendo o erro de deploy.

import { findDuplicateContacts } from './jobs/findDuplicates';
import { triggerDuplicatesScan } from './callable/triggerDuplicatesScan';

export { findDuplicateContacts, triggerDuplicatesScan };
