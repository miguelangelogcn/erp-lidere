
// Import jobs
import { findDuplicateContacts } from "./jobs/findDuplicates";

// Se você tiver outras funções em outros arquivos (como a processDispatchQueue),
// você deve importá-las e exportá-las aqui também.
// Ex: import { processDispatchQueue } from './jobs/processDispatch';

// Exporta a função para que o Firebase possa descobri-la.
export { findDuplicateContacts };
