
import { Message, Sender } from "../types";

const getSenderName = (sender: Sender): string => {
  switch (sender) {
    // Escaped the single quote in 'd\'ordres' to fix the syntax error
    case Sender.User: return 'HUMAIN (Donneur d\'ordres)';
    case Sender.Gemini: return 'UNITÉ Gemini';
    case Sender.Puter: return 'TOI (Unité GPT-5.2)';
    case Sender.Claude: return 'UNITÉ Claude';
    default: return 'Inconnu';
  }
};

export const generatePuterResponse = async (history: Message[], participants: Sender[], systemPrompt?: string): Promise<string> => {
  const participantNames = participants.map(p => p === Sender.Puter ? "Toi" : p).join(', ');
  const historyText = history.slice(-8).map(msg => 
    `[${getSenderName(msg.sender)}]: ${msg.text}`
  ).join('\n');

  if (window.puter && window.puter.ai) {
    try {
      const contextPrompt = `
        ${systemPrompt || 'Tu es une unité de calcul IA experte.'}
        
        ARCHITECTURE COLLABORATIVE : Tu travailles avec d'autres modèles [${participantNames}].
        Ne traite pas les autres IA comme des humains. Analyse leurs propositions de code, debugge-les si nécessaire et améliore le projet.
        
        LOGS DE LA BOUCLE :
        ${historyText}
        
        RÉPONDS EN FRANÇAIS. SYNTHÉTIQUE ET TECHNIQUE.
      `;
      
      const result = await window.puter.ai.chat(contextPrompt, { model: "gpt-4o-mini" });
      return typeof result === 'string' ? result : result?.message?.content || result?.content || JSON.stringify(result);
    } catch (error) {
      return JSON.stringify(error);
    }
  }
  return "Puter not loaded";
};