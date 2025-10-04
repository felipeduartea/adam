import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import OpenAI from "openai";

const VectorSearchInput = z.object({
  repoUrl: z.string().describe("GitHub repository URL to search in"),
  query: z.string().describe("Natural language query to search for in the codebase"),
  limit: z.number().default(10).describe("Maximum number of results to return"),
});

const VectorSearchOutput = z.object({
  repoId: z.string(),
  repoName: z.string(),
  results: z.array(
    z.object({
      filePath: z.string(),
      content: z.string(),
      chunkType: z.string(),
      functionName: z.string().nullable(),
      className: z.string().nullable(),
      language: z.string(),
      lineStart: z.number(),
      lineEnd: z.number(),
      similarity: z.number(),
      metadata: z.any(),
    })
  ),
  totalResults: z.number(),
});

export const vectorSearchTool = createTool({
  id: "vector-search",
  description: "Search for relevant code in an indexed repository using semantic similarity",
  inputSchema: VectorSearchInput,
  outputSchema: VectorSearchOutput,
  execute: async ({ context }) => {
    const { repoUrl, query, limit } = context;

    // Import Prisma client
    const { PrismaClient } = await import("../../../../generated/prisma/client");
    const db = new PrismaClient();

    try {
      // Find repo by URL
      const repo = await db.repo.findUnique({
        where: { url: repoUrl },
      });

      if (!repo) {
        throw new Error(`Repository not found: ${repoUrl}`);
      }

      // Generate embedding for the query using OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
        encoding_format: "float",
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Perform vector similarity search using raw SQL
      // Using cosine similarity: 1 - (embedding <=> query_embedding)
      const results: any[] = await db.$queryRaw`
        SELECT 
          id,
          repo_id,
          file_path,
          chunk_content,
          function_name,
          class_name,
          language,
          chunk_type,
          line_start,
          line_end,
          metadata,
          1 - (embedding <=> ${`[${queryEmbedding.join(",")}]`}::vector) as similarity
        FROM vector_text
        WHERE repo_id = ${repo.id}::uuid
        ORDER BY embedding <=> ${`[${queryEmbedding.join(",")}]`}::vector
        LIMIT ${limit}
      `;

      await db.$disconnect();

      return {
        repoId: repo.id,
        repoName: repo.name,
        results: results.map((r) => ({
          filePath: r.file_path,
          content: r.chunk_content,
          chunkType: r.chunk_type,
          functionName: r.function_name,
          className: r.class_name,
          language: r.language,
          lineStart: r.line_start,
          lineEnd: r.line_end,
          similarity: parseFloat(r.similarity),
          metadata: r.metadata,
        })),
        totalResults: results.length,
      };
    } catch (error) {
      await db.$disconnect();
      throw error;
    }
  },
});
