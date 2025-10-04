export interface CodeChunk {
  content: string;
  metadata: {
    type: 'function' | 'class' | 'file';
    name?: string;
    language: string;
    filePath: string;
    startLine: number;
    endLine: number;
    imports?: string[];
  };
}

export interface RepoData {
  id: string;
  url: string;
  name: string;
  localPath: string;
}

export interface ParsedFile {
  filePath: string;
  chunks: CodeChunk[];
}
