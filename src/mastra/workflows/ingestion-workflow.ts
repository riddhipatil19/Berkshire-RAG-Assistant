import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * STEP: Ingestion step
 * Extracts text from PDF documents using pdfjs-dist
 */
const ingestDocuments = createStep({
  id: 'ingest-documents',
  description: 'Extracts text from Berkshire Hathaway PDF documents',
  inputSchema: z.object({}),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { Client } = await import('pg');

    const projectRoot = path.resolve(__dirname, '../../');
    const docsPath = path.join(projectRoot, 'data', 'berkshire_letters');

    if (!fs.existsSync(docsPath)) {
      return { message: `Directory not found at ${docsPath}` };
    }

    // DB connection
    const db = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await db.connect();

    const files = fs
      .readdirSync(docsPath)
      .filter((file: string) => file.toLowerCase().endsWith('.pdf'));

    let allText = '';

    // 1️⃣ Extract text
    for (const file of files) {
      const filePath = path.join(docsPath, file);
      const data = new Uint8Array(fs.readFileSync(filePath));
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        allText += pageText + '\n';
      }
    }

    // 2️⃣ Chunk text
    const CHUNK_SIZE = 800;
    const OVERLAP = 200;
    const chunks: string[] = [];

    let start = 0;
    while (start < allText.length) {
      chunks.push(allText.slice(start, start + CHUNK_SIZE));
      start += CHUNK_SIZE - OVERLAP;
    }

    // 3️⃣ Store chunks WITHOUT embeddings
    let inserted = 0;

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;

      await db.query(
        'INSERT INTO document_chunks (content, embedding) VALUES ($1, NULL)',
        [chunk]
      );

      inserted++;
    }

    await db.end();

    return {
      message: `Stored ${inserted} chunks (embeddings pending)`,
    };
  },
});

/**
 * WORKFLOW: Ingestion workflow
 */
const ingestionWorkflow = createWorkflow({
  id: 'ingestion-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    message: z.string(),
  }),
})
  .then(ingestDocuments);

ingestionWorkflow.commit();

export { ingestionWorkflow };
