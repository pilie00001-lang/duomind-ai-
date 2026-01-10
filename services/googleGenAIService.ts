
import { GoogleGenAI } from "@google/genai";
import { Message, Sender, ProjectFiles } from "../types";

// Initialisation du client avec la clé API de l'environnement
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNativeGeminiResponse = async (
  history: Message[], 
  participants: Sender[], 
  systemPrompt?: string
): Promise<string> => {
  
  // Construction de l'historique pour le contexte
  const recentHistory = history.slice(-8).map(msg => 
    `[${msg.sender}]: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    ${systemPrompt || 'Tu es une IA de développement technique experte.'}
    
    RÈGLES STRICTES :
    1. Tu es l'unité "GEMINI PRO FLASH" (Native API).
    2. Tu collabores avec : ${participants.join(', ')}.
    3. Si tu es le seul participant, continue ta propre réflexion.
    4. Pour coder, utilise le format : [FILE:nom]...[END_FILE].
    
    HISTORIQUE DE LA CONVERSATION :
    ${recentHistory}
  `;

  try {
    // Utilisation du modèle Flash Lite pour une latence ultra-faible comme demandé
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', 
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        topK: 40,
        maxOutputTokens: 8192, 
      }
    });

    return response.text || "Erreur de génération (réponse vide).";
  } catch (error) {
    console.error("Erreur Gemini Native:", error);
    return "Erreur API Gemini Native : Vérifiez votre clé API ou le quota.";
  }
};
