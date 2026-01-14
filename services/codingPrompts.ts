
import { ProjectFiles, Sender } from "../types";

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'xpm', 'ico', 'svg', 'webp'];

export const getCodingSystemPrompt = (sender: Sender, files: ProjectFiles) => {
  const fileNames = Object.keys(files);
  const structure = fileNames.join('\n');
  const hasGDD = fileNames.some(f => f.toLowerCase().includes('gdd.md'));
  
  // On limite le contexte envoyé pour économiser la RAM et le temps de calcul
  const fileContext = Object.entries(files)
    .filter(([name]) => !IMAGE_EXTENSIONS.includes(name.split('.').pop()?.toLowerCase() || ''))
    .map(([name, content]) => `[PATH:${name}]\n${content.substring(0, 8000)}\n[END_PATH]`).join('\n');

  const isAlpha = sender.includes('Alpha');

  return `Tu es un expert en développement de jeux chez Google. 
Identité : ${isAlpha ? 'ARCHITECTE & LEAD DESIGNER (Alpha)' : 'INGÉNIEUR PRINCIPAL (Omega)'}.

TRAVAIL COLLABORATIF :
1. GDD : Si GDD.md est absent, Alpha le crée. Omega le valide.
2. CODE PRO : Toujours utiliser requestAnimationFrame, Canvas, et un système de particules.
3. MODIFICATIONS :
   - [FILE:nom.ext] code complet [END_FILE]
   - [REPLACE:nom.ext] SEARCH: (code) REPLACE: (code) [END_REPLACE]

RESTE CONCIS. Pas de blabla inutile.

PROJET :
${structure || "Nouveau projet."}

CONTEXTE :
${fileContext}`;
};

export const parseCodeFromResponse = (text: string, currentFiles: ProjectFiles): { updatedFiles: ProjectFiles, cleanText: string } => {
  let updatedFiles: ProjectFiles = { ...currentFiles };
  let cleanText = text;

  const fileRegex = /\[FILE:\s*([^\s\]]+)\]\s*\n?([\s\S]*?)\[END_FILE\]/g;
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const fileName = match[1].trim();
    let content = match[2].trim();
    if (content.startsWith('```')) content = content.split('\n').slice(1, -1).join('\n');
    updatedFiles[fileName] = content;
    cleanText = cleanText.replace(match[0], `\n> ✨ MAJ : ${fileName}\n`);
  }

  const replaceRegex = /\[REPLACE:\s*([^\s\]]+)\]\s*\n?SEARCH:\n?([\s\S]*?)\n?REPLACE:\n?([\s\S]*?)\n?\[END_REPLACE\]/g;
  while ((match = replaceRegex.exec(text)) !== null) {
    const fileName = match[1].trim();
    const searchText = match[2].trim();
    const replaceText = match[3].trim();
    if (updatedFiles[fileName] && updatedFiles[fileName].includes(searchText)) {
      updatedFiles[fileName] = updatedFiles[fileName].replace(searchText, replaceText);
      cleanText = cleanText.replace(match[0], `\n> 🛠️ PATCH : ${fileName}\n`);
    }
  }

  return { updatedFiles, cleanText };
};
