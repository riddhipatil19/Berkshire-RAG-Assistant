import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { retrieveChunks } from '../services/retriever';

/**
 * STEP: RAG Answering
 * - Retrieval is always performed
 * - LLM is used only if API key exists
 * - ONLY final answer is returned to caller
 */
const ragStep = createStep({
  id: 'rag-answer',
  description: 'Answers questions using retrieved context',
  inputSchema: z.object({
    question: z.string(),
  }),
  outputSchema: z.object({
    answer: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { question } = inputData;

    // 1️⃣ Retrieve context (internal only)
    const chunks = await retrieveChunks(question, 5);

    // 2️⃣ If no API key → safe fallback answer
    if (!process.env.OPENAI_API_KEY) {
      return {
        answer:
          "I'm unable to generate a synthesized answer because the language model is currently disabled. Please configure the API key to enable full answers.",
      };
    }

    // 3️⃣ LLM answering (activates automatically when key is present)
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are a financial assistant answering questions strictly using the provided context.

Context:
${chunks.join('\n\n')}

Question:
${question}

Instructions:
- Answer clearly and concisely
- If the answer is not present in the context, say so
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      answer: response.choices[0].message.content || '',
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
  }),
}).then(ragStep);

ragWorkflow.commit();

export { ragWorkflow };
