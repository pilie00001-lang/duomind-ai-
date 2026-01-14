
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Initialisation avec la clé d'environnement (automatiquement injectée)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateNativeGeminiResponse = async (
  history: Message[], 
  participantsNames: string[], 
  systemPrompt: string,
  agentName: string
): Promise<string> => {
  try {
    // Construction de l'historique pour le modèle
    // On convertit les messages en format compatible Gemini
    const contents = history.slice(-10).map(m => ({
      role: m.authorName === agentName ? 'model' : 'user',
      parts: [{ text: `[${m.authorName || 'Interlocuteur'}]: ${m.text}` }]
    }));

    // On ajoute le prompt système et la demande actuelle
    const finalPrompt = `${systemPrompt}\n\nTu es ${agentName}. Analyse les fichiers et la discussion précédente pour répondre de manière pertinente.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...contents,
        { role: 'user', parts: [{ text: finalPrompt }] }
      ],
      config: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "L'IA n'a pas pu générer de réponse.";
  } catch (e) {
    console.error("Gemini API Error:", e);
    return "⚠️ Erreur de connexion avec l'API Gemini. Vérifiez votre clé ou le quota.";
  }
};
