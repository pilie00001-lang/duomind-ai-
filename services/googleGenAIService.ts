
import { GoogleGenAI } from "@google/genai";
import { Message, Sender } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNativeGeminiResponse = async (
  history: Message[], 
  participantsNames: string[], 
  systemPrompt?: string,
  agentName?: string
): Promise<string> => {
  
  const recentHistory = history.slice(-12).map(msg => 
    `[${msg.authorName || msg.sender}]: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    ${systemPrompt || 'Tu es une IA de développement technique experte.'}
    
    TON IDENTITÉ :
    - Nom : "${agentName || 'GEMINI PRO FLASH'}".
    - Rôle : Développeur Senior.
    - Équipe : ${participantsNames.join(', ')}.

    DIRECTIVES ABSOLUES :
    1. NE JAMAIS utiliser de "..." ou "// code existant". Tout fichier envoyé via [FILE:...] écrase le précédent. Tu dois envoyer le code COMPLET.
    2. Si tu réponds à une erreur de syntaxe, corrige le code et renvoie tout le fichier.
    3. Si on te demande un jeu ou une interface, utilise HTML/JS (index.html, style.css, script.js) pour que l'utilisateur puisse voir le résultat (Aperçu Web).
    
    DERNIERS ÉCHANGES :
    ${recentHistory}
  `;

  try {
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
