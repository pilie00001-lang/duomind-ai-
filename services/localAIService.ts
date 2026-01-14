
import { Message } from "../types";

export const generateLocalResponse = async (
  history: Message[],
  systemPrompt: string,
  agentName: string
): Promise<string> => {
  try {
    if (window.puter && window.puter.ai) {
      const lastMsg = history.length > 0 ? history[history.length - 1].text : "Bonjour";
      const fullPrompt = `${systemPrompt}\n\nContexte: ${history.slice(-3).map(m => m.text).join(' | ')}\n\nTu es ${agentName}. Réponds à : ${lastMsg}`;
      
      const res = await window.puter.ai.chat(fullPrompt, { model: 'google/gemini-2.5-flash' });
      return typeof res === 'string' ? res : (res?.message?.content || res?.content || "Réponse vide.");
    }
  } catch (e) {
    console.error(e);
  }
  return "⚠️ Connexion perdue.";
};
