
import { Message, Sender } from "../types";

export const generateGeminiResponse = async (
  history: Message[], 
  participantsNames: string[], 
  systemPrompt?: string,
  agentName?: string
): Promise<string> => {
  const recentHistory = history.slice(-6).map(msg => 
    `[${msg.authorName || msg.sender}]: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    ${systemPrompt || 'Tu es une IA de développement technique.'}
    
    TON IDENTITÉ : "${agentName || 'Gemini'}".
    
    RÈGLE D'OR : 
    Ne jamais abréger le code. [FILE:...] remplace tout le contenu.
    Écris TOUJOURS le code complet, ligne par ligne.
    Pas de "..." ou "# code ici".
    
    HISTORIQUE :
    ${recentHistory}
  `;

  if (window.puter && window.puter.ai) {
    try {
      const result = await window.puter.ai.chat(fullPrompt, { model: 'google/gemini-2.5-flash' });
      return typeof result === 'string' ? result : result?.message?.content || result?.content || "";
    } catch (err) {
      console.error(err);
      return "Désolé, quota atteint ou erreur technique.";
    }
  }
  return "Puter non chargé.";
};
