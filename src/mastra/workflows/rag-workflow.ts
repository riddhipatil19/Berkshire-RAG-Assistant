import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { retrieveChunks } from '../services/retriever';

/**
 * STEP: RAG Answering
 * Uses LLM only if API key exists
 */
const ragStep = createStep({
  id: 'rag-answer',
  description: 'Answers questions using retrieved context',
  inputSchema: z.object({
    question: z.string(),
  }),
  outputSchema: z.object({
    answer: z.string(),
    context: z.array(z.string()),
    llmUsed: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    const { question } = inputData;

    // 1️⃣ Retrieve context
    const chunks = await retrieveChunks(question, 5);

    // 2️⃣ If no API key → return context only
    if (!process.env.OPENAI_API_KEY) {
      return {
        answer:
          'LLM is disabled. Showing retrieved context only. Add API key to enable answers.',
        context: chunks,
        llmUsed: false,
      };
    }

    // 3️⃣ LLM answering (will activate automatically later)
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are a financial assistant answering questions using the provided context.

Context:
${chunks.join('\n\n')}

Question:
${question}

Answer clearly and concisely. If the answer is not in the context, say so.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      answer: response.choices[0].message.content || '',
      context: chunks,
      llmUsed: true,
    };
  },
});

/**
 * WORKFLOW: RAG workflow
 */
const ragWorkflow = createWorkflow({
  id: 'rag-workflow',
  inputSchema: z.object({
    question: z.string(),
  }),
  outputSchema: z.object({
    answer: z.string(),
    context: z.array(z.string()),
    llmUsed: z.boolean(),
  }),
})
  .then(ragStep);

ragWorkflow.commit();

export { ragWorkflow };
