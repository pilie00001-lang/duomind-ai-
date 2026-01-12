
import { Message } from "../types";

export const generateLocalResponse = async (
  history: Message[],
  systemPrompt: string,
  agentName: string,
  endpoint?: string,
  model: string = "SmolLM-135M-Instruct-v0.2-q4f16_1-MLC"
): Promise<string> => {
  
  // Toujours tenter le fallback Cloud par défaut pour la stabilité mobile
  try {
    if (window.puter && window.puter.ai) {
      const lastMsg = history.length > 0 ? history[history.length - 1].text : "Bonjour";
      const fullPrompt = `${systemPrompt}\n\nHistorique récent:\n${history.slice(-3).map(m => m.text).join('\n')}\n\nRéponds en tant que ${agentName} à: ${lastMsg}`;
      
      const cloudRes = await window.puter.ai.chat(fullPrompt, { model: 'gpt-4o-mini' });
      
      // Extraction robuste du texte
      if (typeof cloudRes === 'string') return cloudRes;
      if (cloudRes?.message?.content) return cloudRes.message.content;
      if (cloudRes?.content) return cloudRes.content;
      
      return "(Inférence réussie mais réponse vide)";
    }
  } catch (e) {
    console.error("Erreur Fallback Cloud:", e);
  }
  
  return "⚠️ Service IA indisponible sur ce terminal.";
};
