
import { Message } from "../types";
import { generateNativeGeminiResponse } from "./googleGenAIService";

export const generateGeminiResponse = async (
  history: Message[], 
  participantsNames: string[], 
  systemPrompt?: string,
  agentName?: string
): Promise<string> => {
  // Redirection vers le service natif Gemini SDK
  return generateNativeGeminiResponse(
    history, 
    participantsNames, 
    systemPrompt || "Tu es une IA experte.", 
    agentName || "Gemini"
  );
};
