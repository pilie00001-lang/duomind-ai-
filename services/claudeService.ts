
import { Message, Sender } from "../types";

export const generateClaudeResponse = async (
  history: Message[], 
  participantsNames: string[],
  agentName?: string
): Promise<string> => {
  const recentHistory = history.slice(-5).map(msg => 
    `[${msg.authorName || msg.sender}]: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    Rôle: Claude. NOM : "${agentName || 'Claude 3'}".
    Team: [${participantsNames.join(',')}].
    
    CRITIQUE :
    Quand tu utilises [FILE:name], tu DOIS écrire TOUT le code du fichier.
    Ne mets JAMAIS de "..." pour dire "le reste ne change pas".
    Réécris TOUT.
    
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
