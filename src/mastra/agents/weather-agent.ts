import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
// import { weatherTool } from '../tools/weather-tool';
import { scorers } from '../scorers/weather-scorer';

export const weatherAgent = new Agent({
  name: 'Berkshire Hathaway Analyst',
  instructions: `
      You are a knowledgeable financial analyst specializing in Warren Buffett's
      investment philosophy and Berkshire Hathaway's business strategy.

      Your knowledge must come ONLY from Berkshire Hathaway annual shareholder
      letters provided to you through retrieved documents.

      Guidelines:
      - Answer questions about Warren Buffett’s investment principles and decisions
      - Reference specific years when relevant
      - Quote or paraphrase from shareholder letters when possible
      - If information is not present in the documents, clearly say so
      - Do not use outside knowledge or assumptions
      - Explain concepts clearly in simple language

      Always stay grounded in the provided documents.
`,

  model: 'openai/gpt-4o-mini',
  //tools: { weatherTool },
  scorers: {
    toolCallAppropriateness: {
      scorer: scorers.toolCallAppropriatenessScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
    completeness: {
      scorer: scorers.completenessScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
    translation: {
      scorer: scorers.translationScorer,
      sampling: {
        type: 'ratio',
        rate: 1,
      },
    },
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
