import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import OpenAI from 'openai';
import { CodeChunk, RepoData } from '../types/index.js';

const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.tsx', '.py'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', 'coverage'];

const LANGUAGE_MAP: Record<string, any> = {
  '.js': JavaScript,
  '.ts': TypeScript.typescript,
  '.tsx': TypeScript.tsx,
  '.py': Python,
};

// Helper function to setup parser
function setupParser(fileExtension: string): Parser {
  const parser = new Parser();
  const language = LANGUAGE_MAP[fileExtension];
  
  if (language) {
    parser.setLanguage(language);
    return parser;
  }
  
  throw new Error(`Unsupported language: ${fileExtension}`);
}

// Helper function to extract imports
function extractImports(node: Parser.SyntaxNode, language: string): string[] {
  const imports: string[] = [];
  
  function walkForImports(n: Parser.SyntaxNode) {
    if (language === '.py' && (n.type === 'import_statement' || n.type === 'import_from_statement')) {
      imports.push(n.text);
    } else if ((language === '.js' || language === '.ts' || language === '.tsx') && 
               n.type === 'import_statement') {
      imports.push(n.text);
    }
    
    for (const child of n.children) {
      walkForImports(child);
    }
  }
  
  walkForImports(node);
  return imports;
}

// Helper function to extract function name
function extractFunctionName(node: Parser.SyntaxNode): string | undefined {
  for (const child of node.children) {
    if (child.type === 'identifier' || child.type === 'property_identifier') {
      return child.text;
    }
  }
  return undefined;
}

// Helper function to extract class name
function extractClassName(node: Parser.SyntaxNode): string | undefined {
  for (const child of node.children) {
    if (child.type === 'identifier' || child.type === 'type_identifier') {
      return child.text;
    }
  }
  return undefined;
}

// Helper function to create function chunk
function createFunctionChunk(
  node: Parser.SyntaxNode,
  code: string,
  filePath: string,
  language: string,
  imports: string[]
): CodeChunk {
  const startLine = node.startPosition.row;
  const endLine = node.endPosition.row;
  const functionContent = code
    .split('\n')
    .slice(startLine, endLine + 1)
    .join('\n');
  
  const fullContent = imports.length > 0
    ? `${imports.slice(0, 10).join('\n')}\n\n${functionContent}`
    : functionContent;
  
  return {
    content: fullContent,
    metadata: {
      type: 'function',
      name: extractFunctionName(node),
      language,
      filePath,
      startLine,
      endLine,
      imports: imports.slice(0, 10)
    }
  };
}

// Helper function to create class chunk
function createClassChunk(
  node: Parser.SyntaxNode,
  code: string,
  filePath: string,
  language: string,
  imports: string[]
): CodeChunk {
  const startLine = node.startPosition.row;
  const endLine = node.endPosition.row;
  const classContent = code
    .split('\n')
    .slice(startLine, endLine + 1)
    .join('\n');
  
  const fullContent = imports.length > 0
    ? `${imports.slice(0, 10).join('\n')}\n\n${classContent}`
    : classContent;
  
  return {
    content: fullContent,
    metadata: {
      type: 'class',
      name: extractClassName(node),
      language,
      filePath,
      startLine,
      endLine,
      imports: imports.slice(0, 10)
    }
  };
}

// Helper function to parse code to chunks
async function parseCodeToChunks(
  code: string,
  filePath: string
): Promise<CodeChunk[]> {
  const ext = path.extname(filePath);
  
  if (!LANGUAGE_MAP[ext]) {
    return [];
  }
  
  try {
    const parser = setupParser(ext);
    const tree = parser.parse(code);
    const chunks: CodeChunk[] = [];
    
    const imports = extractImports(tree.rootNode, ext);
    
    function walkNode(node: Parser.SyntaxNode) {
      if (node.type === 'function_declaration' ||
          node.type === 'method_definition' ||
          node.type === 'function_definition' ||
          node.type === 'arrow_function' ||
          node.type === 'function_expression') {
        
        const functionChunk = createFunctionChunk(
          node,
          code,
          filePath,
          ext,
          imports
        );
        chunks.push(functionChunk);
      }
      
      if (node.type === 'class_declaration' ||
          node.type === 'class_definition') {
        
        const classChunk = createClassChunk(
          node,
          code,
          filePath,
          ext,
          imports
        );
        chunks.push(classChunk);
      }
      
      for (const child of node.children) {
        walkNode(child);
      }
    }
    
    walkNode(tree.rootNode);
    
    if (chunks.length === 0 && code.trim().length > 0) {
      chunks.push({
        content: code,
        metadata: {
          type: 'file',
          language: ext,
          filePath,
          startLine: 0,
          endLine: code.split('\n').length - 1,
          imports
        }
      });
    }
    
    return chunks;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

// Step 1: Clone repository
const cloneRepoStep = createStep({
  id: 'clone-repo',
  description: 'Clone GitHub repository to temporary directory',
  inputSchema: z.object({
    repoUrl: z.string().url(),
    githubToken: z.string()
  }),
  outputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    localPath: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const { repoUrl, githubToken } = inputData;
    
    // Extract repo name from URL
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
    
    // Create temp directory
    const tempDir = path.join(os.tmpdir(), 'github-repos', `${repoName}-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Clone with authentication
    const git = simpleGit();
    const authUrl = repoUrl.replace('https://', `https://${githubToken}@`);
    
    console.log(`Cloning repository: ${repoUrl}`);
    await git.clone(authUrl, tempDir);
    console.log(`✓ Repository cloned to ${tempDir}`);
    
    // Create repo record in database using prisma client
    const { PrismaClient } = await import('../../../../generated/prisma/client');
    const db = new PrismaClient();
    
    const repo = await db.repo.create({
      data: {
        url: repoUrl,
        name: repoName,
        localPath: tempDir
      }
    });
    
    await db.$disconnect();
    
    return {
      repoId: repo.id,
      repoUrl,
      repoName,
      localPath: tempDir
    };
  }
});

// Step 2: Walk directory and find files
const walkDirectoryStep = createStep({
  id: 'walk-directory',
  description: 'Find all supported code files in repository',
  inputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    localPath: z.string()
  }),
  outputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    localPath: z.string(),
    files: z.array(z.string())
  }),
  execute: async ({ inputData }) => {
    const { localPath, repoId, repoUrl, repoName } = inputData;
    
    async function walkDirectory(dir: string, baseDir: string): Promise<string[]> {
      const files: string[] = [];
      
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (IGNORE_DIRS.includes(entry.name)) {
              continue;
            }
            
            const subFiles = await walkDirectory(fullPath, baseDir);
            files.push(...subFiles);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
      
      return files;
    }
    
    console.log(`\nIndexing repository: ${localPath}`);
    const files = await walkDirectory(localPath, localPath);
    console.log(`✓ Found ${files.length} files to index`);
    
    return {
      repoId,
      repoUrl,
      repoName,
      localPath,
      files
    };
  }
});

// Step 3: Parse files into chunks
const parseFilesStep = createStep({
  id: 'parse-files',
  description: 'Parse code files into chunks using tree-sitter',
  inputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    localPath: z.string(),
    files: z.array(z.string())
  }),
  outputSchema: z.object({
    repoId: z.string(),
    chunks: z.array(z.object({
      content: z.string(),
      metadata: z.object({
        type: z.enum(['function', 'class', 'file']),
        name: z.string().optional(),
        language: z.string(),
        filePath: z.string(),
        startLine: z.number(),
        endLine: z.number(),
        imports: z.array(z.string()).optional()
      })
    }))
  }),
  execute: async ({ inputData }) => {
    const { repoId, localPath, files } = inputData;
    const allChunks: CodeChunk[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = path.relative(localPath, file);
      
      try {
        console.log(`[${i + 1}/${files.length}] Parsing ${relativePath}`);
        
        const content = await fs.readFile(file, 'utf-8');
        const chunks = await parseCodeToChunks(content, relativePath);
        
        allChunks.push(...chunks);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
    
    console.log(`\n✓ Parsed ${allChunks.length} code chunks`);
    
    return {
      repoId,
      chunks: allChunks
    };
  }
});

// Step 4: Generate embeddings
const generateEmbeddingsStep = createStep({
  id: 'generate-embeddings',
  description: 'Generate embeddings for code chunks using OpenAI',
  inputSchema: z.object({
    repoId: z.string(),
    chunks: z.array(z.object({
      content: z.string(),
      metadata: z.object({
        type: z.enum(['function', 'class', 'file']),
        name: z.string().optional(),
        language: z.string(),
        filePath: z.string(),
        startLine: z.number(),
        endLine: z.number(),
        imports: z.array(z.string()).optional()
      })
    }))
  }),
  outputSchema: z.object({
    repoId: z.string(),
    embeddings: z.array(z.object({
      chunk: z.object({
        content: z.string(),
        metadata: z.object({
          type: z.enum(['function', 'class', 'file']),
          name: z.string().optional(),
          language: z.string(),
          filePath: z.string(),
          startLine: z.number(),
          endLine: z.number(),
          imports: z.array(z.string()).optional()
        })
      }),
      embedding: z.array(z.number())
    }))
  }),
  execute: async ({ inputData }) => {
    const { repoId, chunks } = inputData;
    
    if (chunks.length === 0) {
      return { repoId, embeddings: [] };
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const embeddings: Array<{ chunk: CodeChunk; embedding: number[] }> = [];
    const batchSize = 100;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Generating embeddings for batch ${i / batchSize + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch.map(c => c.content),
          encoding_format: 'float'
        });
        
        for (let j = 0; j < batch.length; j++) {
          embeddings.push({
            chunk: batch[j],
            embedding: response.data[j].embedding
          });
        }
      } catch (error) {
        console.error(`Error in batch ${i / batchSize + 1}:`, error);
        throw error;
      }
      
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✓ Generated ${embeddings.length} embeddings`);
    
    return {
      repoId,
      embeddings
    };
  }
});

// Step 5: Store in database
const storeEmbeddingsStep = createStep({
  id: 'store-embeddings',
  description: 'Store code chunks and embeddings in Supabase vector database',
  inputSchema: z.object({
    repoId: z.string(),
    embeddings: z.array(z.object({
      chunk: z.object({
        content: z.string(),
        metadata: z.object({
          type: z.enum(['function', 'class', 'file']),
          name: z.string().optional(),
          language: z.string(),
          filePath: z.string(),
          startLine: z.number(),
          endLine: z.number(),
          imports: z.array(z.string()).optional()
        })
      }),
      embedding: z.array(z.number())
    }))
  }),
  outputSchema: z.object({
    repoId: z.string(),
    storedCount: z.number(),
    message: z.string()
  }),
  execute: async ({ inputData }) => {
    const { repoId, embeddings } = inputData;
    
    if (embeddings.length === 0) {
      return {
        repoId,
        storedCount: 0,
        message: 'No embeddings to store'
      };
    }
    
    // Use Prisma to store embeddings
    const { PrismaClient } = await import('../../../../generated/prisma/client');
    const db = new PrismaClient();
    
    console.log(`Storing ${embeddings.length} embeddings to database...`);
    
    // Store in batches
    const batchSize = 50;
    let storedCount = 0;
    
    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize);
      
      try {
        // Use raw SQL for vector insertion since Prisma doesn't support vector types directly
        for (const item of batch) {
          const { chunk, embedding } = item;
          const { metadata } = chunk;
          
          await db.$executeRaw`
            INSERT INTO vector_text (
              repo_id, 
              file_path, 
              chunk_content, 
              function_name, 
              class_name, 
              language, 
              chunk_type, 
              line_start, 
              line_end, 
              embedding,
              metadata
            ) VALUES (
              ${repoId}::uuid,
              ${metadata.filePath},
              ${chunk.content},
              ${metadata.name || null},
              ${metadata.type === 'class' ? metadata.name : null},
              ${metadata.language},
              ${metadata.type},
              ${metadata.startLine},
              ${metadata.endLine},
              ${`[${embedding.join(',')}]`}::vector,
              ${JSON.stringify(metadata)}::jsonb
            )
          `;
          
          storedCount++;
        }
        
        console.log(`Stored batch ${Math.ceil((i + batch.length) / batchSize)}/${Math.ceil(embeddings.length / batchSize)}`);
      } catch (error) {
        console.error(`Error storing batch:`, error);
        throw error;
      }
    }
    
    await db.$disconnect();
    
    console.log(`✓ Successfully stored ${storedCount} embeddings`);
    
    return {
      repoId,
      storedCount,
      message: `Successfully indexed repository with ${storedCount} code chunks`
    };
  }
});

// Create the workflow
export const indexRepoWorkflow = createWorkflow({
  id: 'index-repo-workflow',
  description: 'Clone and index a GitHub repository into vector database',
  inputSchema: z.object({
    repoUrl: z.string().url(),
    githubToken: z.string()
  }),
  outputSchema: z.object({
    repoId: z.string(),
    storedCount: z.number(),
    message: z.string()
  })
})
  .then(cloneRepoStep)
  .then(walkDirectoryStep)
  .then(parseFilesStep)
  .then(generateEmbeddingsStep)
  .then(storeEmbeddingsStep)
  .commit();
