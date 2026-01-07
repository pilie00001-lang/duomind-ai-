
import { Message, Sender } from "../types";

const getSenderName = (sender: Sender): string => {
  switch (sender) {
    case Sender.User: return 'HUMAIN (Donneur d\'ordres)';
    case Sender.Gemini: return 'TOI (Unité Gemini)';
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
    CONTEXTE : Tu es dans une boucle de rétroaction avec d'autres IA : [${participantNames}].
    L'Humain donne les directives, mais tu dois collaborer techniquement avec les autres IA.
    
    CAPACITÉ SPÉCIALE : Tu as accès à INTERNET via Google Search pour vérifier les bibliothèques, les documentations ou les bugs.
    Si tu utilises des infos du web, cite brièvement tes sources ou les URLs.
    
    HISTORIQUE DE LA BOUCLE :
    ${recentHistory}
    
    Réponds de manière technique et efficace en FRANÇAIS.
  `;

  if (window.puter && window.puter.ai) {
    try {
      // Utilisation du modèle gemini-3-flash-preview qui supporte le grounding
      const result = await window.puter.ai.chat(fullPrompt, { 
        model: 'google/gemini-2.5-flash',
        // Note: Le grounding est géré côté backend par Puter quand le modèle le supporte
      });
      
      let text = typeof result === 'string' ? result : result?.message?.content || result?.content || JSON.stringify(result);
      
      // Extraction des sources de recherche si disponibles dans la réponse enrichie de Puter
      if (result?.groundingMetadata?.searchEntryPoint) {
         text += "\n\n---\n🌐 Sources : Recherche Google effectuée pour validation technique.";
      }
      
      return text;
    } catch (err) {
      return `[Erreur Unité Gemini]: ${JSON.stringify(err)}`;
    }
  }
  return "Puter not loaded";
};
