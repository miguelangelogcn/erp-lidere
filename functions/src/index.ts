import { findDuplicateContacts } from './jobs/findDuplicates';
import { triggerDuplicatesScan } from './callable/triggerDuplicatesScan';

// Exporta AMBAS as funções para que o Firebase possa descobri-las.
export {
  findDuplicateContacts,
  triggerDuplicatesScan
};