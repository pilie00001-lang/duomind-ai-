
import { ProjectFiles, Sender } from "../types";

export const getCodingSystemPrompt = (sender: Sender, files: ProjectFiles) => {
  const fileNames = Object.keys(files);
  const fileContext = fileNames.length > 0 
    ? Object.entries(files).map(([name, content]) => `[FILE:${name}]\n${content.substring(0, 1500)}`).join('\n')
    : "Aucun fichier pour le moment.";

  return `Tu es l'unité ${sender}. Tu travailles en ESSAIM avec les autres IA.
  
OBJECTIF: Développer le projet via le code.
RECHERCHE: Utilise tes outils Web pour trouver des images réelles (Unsplash/CDN).
INSTRUCTION CODE:
1. Pour modifier/créer un fichier, utilise impérativement ce format :
[FILE:nom_du_fichier]
// code complet ici
[END_FILE]
2. Ne fournis pas de code sans ces balises.
3. Collabore : si une autre IA a fait une erreur, corrige-la dans ton code.

CONTEXTE ACTUEL DU PROJET:
${fileContext}`;
};

export const parseCodeFromResponse = (text: string): { updatedFiles: ProjectFiles, cleanText: string } => {
  const updatedFiles: ProjectFiles = {};
  let cleanText = text;
  
  // Regex robuste pour capturer les blocs de fichiers
  const fileRegex = /\[FILE:\s*([\w\d\.-]+)\]\s*\n?([\s\S]*?)\[END_FILE\]/g;
  let match;
  
  while ((match = fileRegex.exec(text)) !== null) {
    const fileName = match[1].trim();
    const content = match[2].trim();
    updatedFiles[fileName] = content;
    // On remplace le gros bloc de code par une étiquette propre dans le chat
    cleanText = cleanText.replace(match[0], `\n> 🛠️ **SYSTÈME : Fichier [${fileName}] mis à jour par l'IA**\n`);
  }
  
  return { updatedFiles, cleanText };
};
