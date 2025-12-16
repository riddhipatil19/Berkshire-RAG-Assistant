import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

import { ingestionWorkflow } from './workflows/ingestion-workflow';
import { retrievalWorkflow } from './workflows/retrieval-workflow';

export const mastra = new Mastra({
  workflows: {
    ingestionWorkflow,
    retrievalWorkflow,
  },
  agents: {},
  storage: new LibSQLStore({
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
