
import { Message, Sender } from "../types";

export const generateClaudeResponse = async (history: Message[], participants: Sender[]): Promise<string> => {
  // Fenêtrage strict pour économiser le quota Puter (Claude coûte cher en tokens)
  const recentHistory = history.slice(-5).map(msg => 
    `[${msg.sender}]: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    Rôle: Claude (Expert Code & Architecture).
    Team: [${participants.join(',')}].
    WEB: ON. Si tu as besoin d'assets visuels, suggère des URLs Unsplash précises.
    MISSION: Analyse, améliore le code et poursuis la collaboration.
    FORMAT: Court, max 100 mots. Code en [FILE:nom]...[END_FILE].
    
    HISTO :
    ${recentHistory}
  `;

  if (window.puter && window.puter.ai) {
    try {
      const result = await window.puter.ai.chat(fullPrompt, { model: 'anthropic/claude-3.5-haiku' });
      return typeof result === 'string' ? result : result?.message?.content || result?.content || "";
    } catch (err) {
      return "Quota Claude atteint ou erreur.";
    }
  }
  return "Puter non chargé.";
};
