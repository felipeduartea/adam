import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import OpenAI from 'openai';
import { githubAnalystAgent } from '../agents/adam/github-analyst-agent';

// Step 1: Find repository and perform vector search
const vectorSearchStep = createStep({
  id: 'vector-search',
  description: 'Search for relevant code chunks using vector similarity',
  inputSchema: z.object({
    repoUrl: z.string().url(),
    scenario: z.string(),
    limit: z.number().default(15)
  }),
  outputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    scenario: z.string(),
    relevantCode: z.array(z.object({
      filePath: z.string(),
      content: z.string(),
      chunkType: z.string(),
      functionName: z.string().nullable(),
      className: z.string().nullable(),
      language: z.string(),
      lineStart: z.number(),
      lineEnd: z.number(),
      similarity: z.number(),
    })),
    totalResults: z.number()
  }),
  execute: async ({ inputData }) => {
    const { repoUrl, scenario, limit } = inputData;

    // Import Prisma client
    const { PrismaClient } = await import('../../../../generated/prisma/client');
    const db = new PrismaClient();

    try {
      // Find repo by URL
      const repo = await db.repo.findUnique({
        where: { url: repoUrl },
      });

      if (!repo) {
        throw new Error(`Repository not found: ${repoUrl}. Please index it first using the index-repo-workflow.`);
      }

      console.log(`\n📊 Searching repository: ${repo.name}`);
      console.log(`🔍 Scenario: ${scenario}`);

      // Generate embedding for the scenario using OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: scenario,
        encoding_format: 'float',
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Perform vector similarity search using raw SQL
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
          1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector) as similarity
        FROM vector_text
        WHERE repo_id = ${repo.id}::uuid
        ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector
        LIMIT ${limit}
      `;

      await db.$disconnect();

      console.log(`✓ Found ${results.length} relevant code chunks`);

      return {
        repoId: repo.id,
        repoUrl: repo.url,
        repoName: repo.name,
        scenario,
        relevantCode: results.map((r) => ({
          filePath: r.file_path,
          content: r.chunk_content,
          chunkType: r.chunk_type,
          functionName: r.function_name,
          className: r.class_name,
          language: r.language,
          lineStart: r.line_start,
          lineEnd: r.line_end,
          similarity: parseFloat(r.similarity),
        })),
        totalResults: results.length,
      };
    } catch (error) {
      await db.$disconnect();
      throw error;
    }
  }
});

// Step 2: Prepare context for agent
const prepareContextStep = createStep({
  id: 'prepare-context',
  description: 'Format code chunks into a structured context for the analyst agent',
  inputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    scenario: z.string(),
    relevantCode: z.array(z.object({
      filePath: z.string(),
      content: z.string(),
      chunkType: z.string(),
      functionName: z.string().nullable(),
      className: z.string().nullable(),
      language: z.string(),
      lineStart: z.number(),
      lineEnd: z.number(),
      similarity: z.number(),
    })),
    totalResults: z.number()
  }),
  outputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    scenario: z.string(),
    formattedContext: z.string(),
    analysisPrompt: z.string()
  }),
  execute: async ({ inputData }) => {
    const { repoId, repoUrl, repoName, scenario, relevantCode, totalResults } = inputData;

    // Group code by file
    const fileGroups = relevantCode.reduce((acc, chunk) => {
      if (!acc[chunk.filePath]) {
        acc[chunk.filePath] = [];
      }
      acc[chunk.filePath].push(chunk);
      return acc;
    }, {} as Record<string, typeof relevantCode>);

    // Format context
    let formattedContext = `# Repository Analysis Context\n\n`;
    formattedContext += `**Repository:** ${repoName}\n`;
    formattedContext += `**URL:** ${repoUrl}\n`;
    formattedContext += `**Scenario:** ${scenario}\n`;
    formattedContext += `**Total Relevant Chunks:** ${totalResults}\n\n`;
    formattedContext += `## Relevant Code Files\n\n`;

    for (const [filePath, chunks] of Object.entries(fileGroups)) {
      formattedContext += `### ${filePath}\n\n`;
      
      for (const chunk of chunks) {
        const identifier = chunk.functionName || chunk.className || 'code block';
        formattedContext += `**${chunk.chunkType}:** \`${identifier}\` (lines ${chunk.lineStart}-${chunk.lineEnd}) [similarity: ${chunk.similarity.toFixed(3)}]\n\n`;
        formattedContext += `\`\`\`${chunk.language}\n${chunk.content}\n\`\`\`\n\n`;
      }
    }

    // Create analysis prompt
    const analysisPrompt = `Analyze the following scenario in the context of the repository ${repoName}:

**Scenario:** ${scenario}

**Context:** I've provided you with ${totalResults} code chunks from the repository that are semantically similar to the scenario. These chunks include functions, classes, and file sections.

Please:
1. Analyze the relevant code and identify key areas that relate to the scenario
2. Explain how these code sections connect to the scenario
3. Identify any patterns, dependencies, or architectural decisions visible in the code
4. If you need to access additional files or more detailed information from GitHub, use the available GitHub MCP tools
5. Provide actionable insights and recommendations for engineers working on this scenario

**Code Context:**
${formattedContext}`;

    console.log('\n📝 Context prepared for agent analysis');

    return {
      repoId,
      repoUrl,
      repoName,
      scenario,
      formattedContext,
      analysisPrompt
    };
  }
});

// Step 3: Agent analysis
const agentAnalysisStep = createStep({
  id: 'agent-analysis',
  description: 'Use the GitHub Analyst Agent to analyze the code and provide insights',
  inputSchema: z.object({
    repoId: z.string(),
    repoUrl: z.string(),
    repoName: z.string(),
    scenario: z.string(),
    formattedContext: z.string(),
    analysisPrompt: z.string()
  }),
  outputSchema: z.object({
    repoId: z.string(),
    repoName: z.string(),
    scenario: z.string(),
    analysis: z.string(),
    keyFindings: z.array(z.string()),
    recommendations: z.array(z.string())
  }),
  execute: async ({ inputData }) => {
    const { repoId, repoUrl, repoName, scenario, formattedContext, analysisPrompt } = inputData;

    console.log('\n🤖 Starting agent analysis...');

    try {
      // Generate analysis using the agent with context parameter
      const result = await githubAnalystAgent.generate(
        `Analyze the following scenario in the context of the repository ${repoName}:

**Scenario:** ${scenario}

I've provided you with relevant code chunks from the repository that are semantically similar to the scenario. These chunks include functions, classes, and file sections.

Please:
1. Analyze the relevant code and identify key areas that relate to the scenario
2. Explain how these code sections connect to the scenario
3. Identify any patterns, dependencies, or architectural decisions visible in the code
4. If you need to access additional files or more detailed information from GitHub, use the available GitHub MCP tools
5. Provide actionable insights and recommendations for engineers working on this scenario`,
        {
          context: [
            {
              role: 'user',
              content: formattedContext
            }
          ]
        }
      );

      console.log('✓ Analysis complete');

      // Extract the text from the result
      const analysisText = result.text || '';

      // Simple parsing to extract key findings and recommendations
      // This is a basic implementation - you may want to enhance it
      const keyFindings: string[] = [];
      const recommendations: string[] = [];

      // Try to extract bullet points or numbered lists as findings/recommendations
      const lines = analysisText.split('\n');
      let inFindingsSection = false;
      let inRecommendationsSection = false;

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.toLowerCase().includes('key finding') || 
            trimmed.toLowerCase().includes('findings:')) {
          inFindingsSection = true;
          inRecommendationsSection = false;
          continue;
        }
        
        if (trimmed.toLowerCase().includes('recommendation') || 
            trimmed.toLowerCase().includes('next step') ||
            trimmed.toLowerCase().includes('action item')) {
          inRecommendationsSection = true;
          inFindingsSection = false;
          continue;
        }

        if (inFindingsSection && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
          keyFindings.push(trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
        }

        if (inRecommendationsSection && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
          recommendations.push(trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
        }
      }

      return {
        repoId,
        repoName,
        scenario,
        analysis: analysisText,
        keyFindings: keyFindings.length > 0 ? keyFindings : ['See full analysis for details'],
        recommendations: recommendations.length > 0 ? recommendations : ['See full analysis for recommendations']
      };
    } catch (error) {
      console.error('Error during agent analysis:', error);
      throw error;
    }
  }
});

// Create the workflow
export const analyzeRepoWorkflow = createWorkflow({
  id: 'analyze-repo-workflow',
  description: 'Analyze a GitHub repository using vector search and AI agent',
  inputSchema: z.object({
    repoUrl: z.string().url().describe('GitHub repository URL'),
    scenario: z.string().describe('Scenario or question to investigate in the codebase'),
    limit: z.number().default(15).describe('Number of code chunks to retrieve')
  }),
  outputSchema: z.object({
    repoId: z.string(),
    repoName: z.string(),
    scenario: z.string(),
    analysis: z.string(),
    keyFindings: z.array(z.string()),
    recommendations: z.array(z.string())
  })
})
  .then(vectorSearchStep)
  .then(prepareContextStep)
  .then(agentAnalysisStep)
  .commit();
