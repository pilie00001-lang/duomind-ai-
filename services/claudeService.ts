
import { Message, Sender } from "../types";

const getSenderName = (sender: Sender): string => {
  switch (sender) {
    case Sender.User: return 'Humain';
    case Sender.Gemini: return 'Gemini';
    case Sender.Puter: return 'GPT-5.2';
    case Sender.Claude: return 'Toi (Claude)';
    default: return 'Inconnu';
  }
};

export const generateClaudeResponse = async (history: Message[], participants: Sender[]): Promise<string> => {
  const participantNames = participants.map(p => p === Sender.Claude ? "Toi" : p).join(', ');
  const recentHistory = history.slice(-10).map(msg => 
    `${getSenderName(msg.sender)}: ${msg.text}`
  ).join('\n');

  const fullPrompt = `
    Tu es Claude. Tu collabores avec : [${participantNames}].
    Analyse les arguments ou le code précédent et apporte ta pierre à l'édifice.
    
    HISTORIQUE :
    ${recentHistory}
    
    Réponds en FRANÇAIS (max 100 mots).
  `;

  if (window.puter && window.puter.ai) {
    try {
      const result = await window.puter.ai.chat(fullPrompt, { model: 'anthropic/claude-3.5-haiku' });
      return typeof result === 'string' ? result : result?.message?.content || result?.content || JSON.stringify(result);
    } catch (err) {
      return JSON.stringify(err);
    }
  }
  return "Puter not loaded";
};
