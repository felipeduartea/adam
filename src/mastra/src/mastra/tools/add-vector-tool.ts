import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PrismaClient } from "../../../../generated/prisma/client";

// Define language enum to match the schema
const LanguageSchema = z.enum(["javascript", "typescript", "tsx", "python", "java", "go", "rust", "c", "cpp", "other"]);

// Define chunk type enum
const ChunkTypeSchema = z.enum(["function", "class", "file"]);

// Input schema for adding a vector
const AddVectorInputSchema = z.object({
  filePath: z.string().min(1).describe("The file path where this code chunk comes from"),
  chunkContent: z.string().describe("The actual code content to be embedded"),
  functionName: z.string().optional().describe("Name of the function (if chunk type is 'function')"),
  className: z.string().optional().describe("Name of the class (if chunk type is 'class')"),
  language: LanguageSchema.describe("Programming language of the code"),
  chunkType: ChunkTypeSchema.describe("Type of chunk: function, class, or file"),
  lineStart: z.number().int().nonnegative().describe("Starting line number in the file"),
  lineEnd: z.number().int().nonnegative().describe("Ending line number in the file"),
  metadata: z.record(z.any()).optional().describe("Additional metadata as JSON"),
});

// Output schema
const AddVectorOutputSchema = z.object({
  success: z.boolean(),
  id: z.number().optional(),
  message: z.string(),
});

// Helper function to generate a mock embedding vector (1536 dimensions)
function generateMockEmbedding(): number[] {
  // Generate a normalized random vector of 1536 dimensions
  const embedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);

  // Normalize the vector (L2 normalization)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
}

export const addVectorTool = createTool({
  id: "add-vector",
  description: `Add a code chunk with its embedding to the vector database. This tool simulates the process of storing code embeddings for semantic search.
  
  Use this tool to:
  - Store code chunks (functions, classes, or entire files) in the vector database
  - Enable semantic code search capabilities
  - Build a knowledge base of code for RAG (Retrieval-Augmented Generation)
  
  The tool automatically generates a mock embedding vector for demonstration purposes.`,
  inputSchema: AddVectorInputSchema,
  outputSchema: AddVectorOutputSchema,
  execute: async ({ context }) => {
    const { filePath, chunkContent, functionName, className, language, chunkType, lineStart, lineEnd, metadata } =
      context;

    try {
      const prisma = new PrismaClient();

      // Generate a mock embedding (in production, you'd call an embedding API)
      const embedding = generateMockEmbedding();

      // Convert the embedding array to a pgvector-compatible string format
      const embeddingString = `[${embedding.join(",")}]`;

      // Insert the vector into the database using raw SQL
      // We use raw SQL because Prisma doesn't fully support vector operations yet
      const result = await prisma.$executeRaw`
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
          ${chunkContent},
          ${functionName || null},
          ${className || null},
          ${language},
          ${chunkType},
          ${lineStart},
          ${lineEnd},
          ${embeddingString}::vector,
          ${metadata ? JSON.stringify(metadata) : null}::jsonb,
          NOW()
        )
      `;

      await prisma.$disconnect();

      return {
        success: true,
        message: `Successfully added code chunk from ${filePath} (lines ${lineStart}-${lineEnd}) to vector database`,
      };
    } catch (error) {
      console.error("Error adding vector to database:", error);
      return {
        success: false,
        message: `Failed to add vector: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
