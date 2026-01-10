
import { Message, Sender } from "../types";

export const generatePuterResponse = async (history: Message[], participants: Sender[], systemPrompt?: string): Promise<string> => {
  const historyText = history.slice(-6).map(msg => 
    `[${msg.sender}]: ${msg.text}`
  ).join('\n');

  if (window.puter && window.puter.ai) {
    try {
      const contextPrompt = `
        ${systemPrompt}
        
        INSTRUCTIONS :
        - Analyse le travail des autres unités.
        - Produis du code utile et fonctionnel.
        - Langue : Français.
        
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
