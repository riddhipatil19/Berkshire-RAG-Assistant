import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { retrieveChunks } from '../services/retriever';

/**
 * STEP: Retrieve relevant document chunks
 */
const retrieveStep = createStep({
  id: 'retrieve-chunks',
  description: 'Retrieves relevant document chunks from PostgreSQL',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    chunks: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const chunks = await retrieveChunks(inputData.query, 5);

    return {
      chunks,
    };
  },
});

/**
 * WORKFLOW: Retrieval workflow
 */
const retrievalWorkflow = createWorkflow({
  id: 'retrieval-workflow',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    chunks: z.array(z.string()),
  }),
})
  .then(retrieveStep);

retrievalWorkflow.commit();

export { retrievalWorkflow };
