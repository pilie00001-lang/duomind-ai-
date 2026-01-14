
export enum Sender {
  User = 'USER',
  Gemini = 'GEMINI',
  Puter = 'PUTER',
  Claude = 'CLAUDE',
  GeminiNative = 'GEMINI_NATIVE',
  Local = 'LOCAL',
  Custom = 'CUSTOM'
}

export interface Agent {
  id: string;
  type: Sender;
  name: string;
  color: string;
  isActive: boolean;
  systemPrompt?: string;
  modelName?: string;
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
  participants: string[]; // Liste des IDs d'agents participants
  files: ProjectFiles;
  isCodeMode?: boolean;
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
