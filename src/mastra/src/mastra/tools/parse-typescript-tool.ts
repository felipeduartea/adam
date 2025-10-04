import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";

interface CodeChunk {
  content: string;
  functionName?: string;
  className?: string;
  startLine: number;
  endLine: number;
  type: "function" | "class" | "file";
}

const ParseTypeScriptInputSchema = z.object({
  code: z.string().describe("The TypeScript code to parse"),
  filePath: z.string().describe("The file path of the code"),
});

const ParseTypeScriptOutputSchema = z.object({
  success: z.boolean(),
  chunks: z.array(z.object({
    content: z.string(),
    functionName: z.string().optional(),
    className: z.string().optional(),
    startLine: z.number(),
    endLine: z.number(),
    type: z.enum(["function", "class", "file"]),
  })),
  message: z.string(),
});

function extractFunctionName(node: Parser.SyntaxNode): string | undefined {
  for (const child of node.children) {
    if (child.type === "identifier") {
      return child.text;
    }
  }
  return undefined;
}

function extractClassName(node: Parser.SyntaxNode): string | undefined {
  for (const child of node.children) {
    if (child.type === "type_identifier" || child.type === "identifier") {
      return child.text;
    }
  }
  return undefined;
}

function extractImports(rootNode: Parser.SyntaxNode, code: string): string[] {
  const imports: string[] = [];
  
  function walkNode(node: Parser.SyntaxNode) {
    if (node.type === "import_statement") {
      imports.push(node.text);
    }
    for (const child of node.children) {
      walkNode(child);
    }
  }
  
  walkNode(rootNode);
  return imports;
}

function parseCodeToChunks(code: string, filePath: string): CodeChunk[] {
  const parser = new Parser();
  parser.setLanguage(TypeScript.typescript);
  
  const tree = parser.parse(code);
  const chunks: CodeChunk[] = [];
  const imports = extractImports(tree.rootNode, code);
  const importsText = imports.join("\n");
  
  function walkNode(node: Parser.SyntaxNode) {
    // Handle function declarations
    if (
      node.type === "function_declaration" ||
      node.type === "method_definition" ||
      node.type === "arrow_function" ||
      node.type === "function_signature"
    ) {
      const startLine = node.startPosition.row;
      const endLine = node.endPosition.row;
      const functionContent = code.split("\n").slice(startLine, endLine + 1).join("\n");
      
      const fullContent = importsText ? `${importsText}\n\n${functionContent}` : functionContent;
      
      chunks.push({
        content: fullContent,
        functionName: extractFunctionName(node),
        startLine,
        endLine,
        type: "function",
      });
    }
    
    // Handle class declarations
    if (node.type === "class_declaration") {
      const startLine = node.startPosition.row;
      const endLine = node.endPosition.row;
      const classContent = code.split("\n").slice(startLine, endLine + 1).join("\n");
      
      const fullContent = importsText ? `${importsText}\n\n${classContent}` : classContent;
      
      chunks.push({
        content: fullContent,
        className: extractClassName(node),
        startLine,
        endLine,
        type: "class",
      });
    }
    
    for (const child of node.children) {
      walkNode(child);
    }
  }
  
  walkNode(tree.rootNode);
  
  // If no chunks found, treat the whole file as one chunk
  if (chunks.length === 0) {
    chunks.push({
      content: code,
      startLine: 0,
      endLine: code.split("\n").length - 1,
      type: "file",
    });
  }
  
  return chunks;
}

export const parseTypeScriptTool = createTool({
  id: "parse-typescript",
  description: `Parse TypeScript code into semantic chunks (functions and classes) using tree-sitter.
  
  This tool:
  - Uses tree-sitter AST parser to identify code structures
  - Extracts functions, classes, and their metadata
  - Includes relevant imports with each chunk
  - Returns structured chunks ready for embedding
  
  Use this tool before indexing code to break it into meaningful, searchable pieces.`,
  inputSchema: ParseTypeScriptInputSchema,
  outputSchema: ParseTypeScriptOutputSchema,
  execute: async ({ context }) => {
    const { code, filePath } = context;

    try {
      const chunks = parseCodeToChunks(code, filePath);
      
      return {
        success: true,
        chunks: chunks.map(chunk => ({
          content: chunk.content,
          functionName: chunk.functionName,
          className: chunk.className,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          type: chunk.type,
        })),
        message: `Successfully parsed ${chunks.length} chunks from ${filePath}`,
      };
    } catch (error) {
      console.error("Error parsing TypeScript code:", error);
      return {
        success: false,
        chunks: [],
        message: `Failed to parse code: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
