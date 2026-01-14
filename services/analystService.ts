
import { GoogleGenAI } from "@google/genai";
import { Message, Sender } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateAnalysis = async (history: Message[]): Promise<string> => {
  if (history.length === 0) return "";

  const recentExchanges = history.slice(-5).map(msg => {
    const name = msg.authorName || (msg.sender === Sender.User ? 'Humain' : 'IA');
    return `${name}: ${msg.text}`;
  }).join('\n');

  const prompt = `
    Tu es "L'Observateur", une IA analytique.
    Voici les derniers échanges d'un projet de développement :
    ${recentExchanges}

    Tâche :
    Résume l'avancée technique ou le point de tension en 1 phrase courte et percutante.
    Langue : FRANÇAIS.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
      }
    });
    return response.text?.trim() || "";
  } catch (e) {
    return "";
  }
};
