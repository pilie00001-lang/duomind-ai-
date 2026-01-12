
import { Message, Sender } from "../types";

export const generatePuterResponse = async (
  history: Message[], 
  participantsNames: string[], 
  systemPrompt?: string,
  agentName?: string
): Promise<string> => {
  const historyText = history.slice(-6).map(msg => 
    `[${msg.authorName || msg.sender}]: ${msg.text}`
  ).join('\n');

  if (window.puter && window.puter.ai) {
    try {
      const contextPrompt = `
        ${systemPrompt}
        
        TON NOM : "${agentName || 'GPT-4o'}".
        
        ATTENTION : Les fichiers sont écrasés à chaque modification.
        TU DOIS FOURNIR LE CODE COMPLET DANS [FILE:...].
        INTERDIT : "..." ou "// existing code".
        
        HISTO :
        ${historyText}
      `;
      
      const result = await window.puter.ai.chat(contextPrompt, { model: "gpt-4o-mini" });
      return typeof result === 'string' ? result : result?.message?.content || result?.content || "";
    } catch (error) {
      return "Erreur Puter Quota.";
    }
  }
  return "Puter not loaded";
};
