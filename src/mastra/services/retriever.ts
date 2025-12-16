import { Client } from 'pg';

/**
 * Retrieves relevant document chunks.
 * Works WITHOUT embeddings (fallback mode).
 * When embeddings exist, vector search will be used automatically.
 */
export async function retrieveChunks(
  query: string,
  limit: number = 5
) {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await db.connect();

  /**
   * 1️⃣ Fallback search (NO embeddings)
   * Uses simple text similarity
   */
  const fallbackResult = await db.query(
    `
    SELECT content
    FROM document_chunks
    WHERE content ILIKE $1
    LIMIT $2
    `,
    [`%${query}%`, limit]
  );

  // If we found something, return it
  if (fallbackResult.rows.length > 0) {
    await db.end();
    return fallbackResult.rows.map(row => row.content);
  }

  /**
   * 2️⃣ Vector search (will work later when embeddings exist)
   * Safe to keep now — it won’t break anything
   */
  const vectorResult = await db.query(
    `
    SELECT content
    FROM document_chunks
    ORDER BY embedding <-> (
      SELECT embedding
      FROM document_chunks
      LIMIT 1
    )
    LIMIT $1
    `,
    [limit]
  );

  await db.end();

  return vectorResult.rows.map(row => row.content);
}
