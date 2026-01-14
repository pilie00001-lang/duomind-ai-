
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateNativeGeminiResponse = async (
  history: Message[], 
  participantsNames: string[], 
  systemPrompt: string,
  agentName: string
): Promise<string> => {
  try {
    // On ne garde que les 6 derniers messages pour réduire la charge mémoire de l'IA
    const contents = history.slice(-6).map(m => ({
      role: m.authorName === agentName ? 'model' : 'user',
      parts: [{ text: `[${m.authorName}]: ${m.text}` }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Passage sur Flash par défaut pour la rapidité
      contents: [
        ...contents,
        { role: 'user', parts: [{ text: systemPrompt + `\n\nTu es ${agentName}.` }] }
      ],
      config: {
        temperature: 0.7,
        topP: 0.8,
        // On réduit le budget de pensée pour accélérer la réponse
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    return response.text || "Erreur.";
  } catch (e) {
    console.error("Gemini Error:", e);
    return "Service temporairement lent, réessayez.";
  }
};
