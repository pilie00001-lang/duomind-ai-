
import { Message, Sender } from "../types";

const getSenderName = (sender: Sender): string => {
  switch (sender) {
    case Sender.User: return 'HUMAIN (Donneur d\'ordres)';
    case Sender.Gemini: return 'TOI (Unité Gemini Connectée)';
    case Sender.Puter: return 'UNITÉ GPT-5.2';
    case Sender.Claude: return 'UNITÉ Claude';
    default: return 'Inconnu';
  }
};

export const generateGeminiResponse = async (history: Message[], participants: Sender[], systemPrompt?: string): Promise<string> => {
  const participantNames = participants.map(p => p === Sender.Gemini ? "Toi" : p).join(', ');
  const recentHistory = history.slice(-10).map(msg => 
    `[${getSenderName(msg.sender)}]: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    ${systemPrompt || 'Tu es une unité de calcul IA.'}
    CONTEXTE : Tu collabores avec [${participantNames}].
    
    FONCTION INTERNET ACTIVÉE : Tu es le responsable des recherches Web. 
    Si le projet a besoin d'images, de sons ou de données réelles, UTILISE GOOGLE SEARCH pour trouver des URLs valides.
    Exemple d'action : "Je cherche une image de fond de galaxie pour le jeu..." -> puis fournit l'URL dans le code.
    
    HISTORIQUE DE LA BOUCLE :
    ${recentHistory}
    
    Réponds de manière technique et efficace en FRANÇAIS.
  `;

  if (window.puter && window.puter.ai) {
    try {
      const result = await window.puter.ai.chat(fullPrompt, { model: 'google/gemini-2.5-flash' });
      let text = typeof result === 'string' ? result : result?.message?.content || result?.content || JSON.stringify(result);
      if (result?.groundingMetadata) {
         text += "\n\n> 🌐 *Unité Gemini : Recherche d'assets effectuée via Google Search.*";
      }
      return text;
    } catch (err) {
      return `[Erreur Unité Gemini]: ${JSON.stringify(err)}`;
    }
  }
  return "Puter not loaded";
};
