export enum Sender {
  User = 'USER',
  Gemini = 'GEMINI',
  Puter = 'PUTER',
  Claude = 'CLAUDE'
}

export interface Message {
  id: string;
  sender: Sender;
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

// Global declaration for the Puter.com AI interface
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<any>;
      }
    }
  }
}