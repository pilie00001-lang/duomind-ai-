import { Message, Sender } from "../types";

export const generateAnalysis = async (history: Message[]): Promise<string> => {
  if (history.length === 0) return "";

  // On prend juste les derniers messages pour le contexte immédiat
  const recentExchanges = history.slice(-4).map(msg => {
    const name = msg.sender === Sender.User ? 'Humain' : msg.sender === Sender.Gemini ? 'Gemini' : 'GPT-5.2';
    return `${name}: ${msg.text}`;
  }).join('\n');

  const prompt = `
    Tu es "L'Observateur", une IA analytique chargée de débriefer un débat rapide pour un humain.
    Voici les derniers échanges :
    ${recentExchanges}

    Tâche :
    Analyse ce qui vient de se dire en 1 ou 2 phrases maximum.
    - Sois synthétique.
    - Explique l'enjeu ou la dynamique actuelle (ex: "Gemini contredit GPT sur...", "Ils sont d'accord pour dire que...").
    - Langue : FRANÇAIS.
    - Ton : Journalistique / Analyse temps réel.
  `;

  // Utilisation exclusive de Puter.js
  if (window.puter && window.puter.ai) {
    try {
      // Mise à jour vers google/gemini-2.5-flash qui est dans la liste des modèles supportés
      const result = await window.puter.ai.chat(prompt, { model: 'google/gemini-2.5-flash' });
      const text = typeof result === 'string' ? result : result?.message?.content || result?.content;
      if (text) return text;
    } catch (e) {
      console.error("Analyst Puter Error:", e);
    }
  }

  return "";
};