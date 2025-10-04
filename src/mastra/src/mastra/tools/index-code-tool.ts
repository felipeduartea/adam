import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { OpenAI } from "openai";
import { PrismaClient } from "../../../../generated/prisma/client";

const IndexCodeInputSchema = z.object({
  chunks: z.array(z.object({
    content: z.string(),
    functionName: z.string().optional(),
    className: z.string().optional(),
    startLine: z.number(),
    endLine: z.number(),
    type: z.enum(["function", "class", "file"]),
  })).describe("Array of code chunks to index"),
  filePath: z.string().describe("The file path for all chunks"),
  useRealEmbeddings: z.boolean().default(false).describe("If true, use OpenAI embeddings; if false, use mock embeddings"),
});

const IndexCodeOutputSchema = z.object({
  success: z.boolean(),
  indexed: z.number(),
  message: z.string(),
});

// Helper function to generate a mock embedding vector (1536 dimensions)
function generateMockEmbedding(): number[] {
  const embedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
}

async function generateEmbedding(text: string, useReal: boolean): Promise<number[]> {
  if (!useReal) {
    return generateMockEmbedding();
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not found, using mock embeddings");
    return generateMockEmbedding();
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating OpenAI embedding:", error);
    console.warn("Falling back to mock embeddings");
    return generateMockEmbedding();
  }
}

export const indexCodeTool = createTool({
  id: "index-code",
  description: `Index code chunks by generating embeddings and storing them in the vector database.
  
  This tool:
  - Generates embeddings for each code chunk (using OpenAI or mock embeddings)
  - Stores chunks with embeddings in the vector database
  - Enables semantic code search capabilities
  
  Use this tool after parsing code to make it searchable.`,
  inputSchema: IndexCodeInputSchema,
  outputSchema: IndexCodeOutputSchema,
  execute: async ({ context }) => {
    const { chunks, filePath, useRealEmbeddings } = context;

    try {
      const prisma = new PrismaClient();
      let indexed = 0;

      for (const chunk of chunks) {
        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk.content, useRealEmbeddings);
          const embeddingString = `[${embedding.join(",")}]`;

          // Determine language (TypeScript/TSX based on extension)
          const language = filePath.endsWith(".tsx") ? "tsx" : "typescript";

          // Insert into database
          await prisma.$executeRaw`
            INSERT INTO vector_text (
              file_path, 
              chunk_content, 
              function_name, 
              class_name, 
              language, 
              chunk_type, 
              line_start, 
              line_end, 
              embedding, 
              metadata,
              created_at
            ) VALUES (
              ${filePath},
              ${chunk.content},
              ${chunk.functionName || null},
              ${chunk.className || null},
              ${language},
              ${chunk.type},
              ${chunk.startLine},
              ${chunk.endLine},
              ${embeddingString}::vector,
              ${JSON.stringify({ type: chunk.type })}::jsonb,
              NOW()
            )
          `;

          indexed++;
        } catch (error) {
          console.error(`Error indexing chunk at lines ${chunk.startLine}-${chunk.endLine}:`, error);
        }
      }

      await prisma.$disconnect();

      return {
        success: indexed > 0,
        indexed,
        message: `Successfully indexed ${indexed}/${chunks.length} chunks from ${filePath}`,
      };
    } catch (error) {
      console.error("Error indexing code:", error);
      return {
        success: false,
        indexed: 0,
        message: `Failed to index code: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
