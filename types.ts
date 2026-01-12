
export enum Sender {
  User = 'USER',
  Gemini = 'GEMINI',
  Puter = 'PUTER',
  Claude = 'CLAUDE',
  GeminiNative = 'GEMINI_NATIVE',
  Local = 'LOCAL'
}

export interface Agent {
  id: string;
  type: Sender;
  name: string;
  color: string;
  isActive: boolean;
  localEndpoint?: string; // ex: http://localhost:11434/api/generate
  modelName?: string;    // ex: llama3
}

export interface Message {
  id: string;
  sender: Sender;
  authorName?: string;
  text: string;
  timestamp: number;
}

export interface ProjectFiles {
  [filename: string]: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  participants: Sender[];
  isCodeMode?: boolean;
  files: ProjectFiles;
}

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<any>;
      }
    }
  }
}
