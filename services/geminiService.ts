
import { Message, Sender } from "../types";

export const generateGeminiResponse = async (history: Message[], participants: Sender[], systemPrompt?: string): Promise<string> => {
  // On garde les 6 derniers messages pour un contexte suffisant
  const recentHistory = history.slice(-6).map(msg => 
    `[${msg.sender}]: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    ${systemPrompt || 'Tu es une IA de développement technique.'}
    
    IMPORTANT : Tu es dans une boucle de chat. Analyse les messages précédents et réagis.
    Si tu dois coder, utilise le format [FILE:nom]...[END_FILE].
    
    HISTORIQUE RÉCENT :
    ${recentHistory}
  `;

  if (window.puter && window.puter.ai) {
    try {
      // Utilisation du modèle flash pour la rapidité et le coût réduit
      const result = await window.puter.ai.chat(fullPrompt, { model: 'google/gemini-2.5-flash' });
      return typeof result === 'string' ? result : result?.message?.content || result?.content || "";
    } catch (err) {
      console.error(err);
      return "Désolé, quota atteint ou erreur technique.";
    }
  }
  return "Puter non chargé.";
};
