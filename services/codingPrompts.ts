
import { ProjectFiles, Sender } from "../types";

export const getCodingSystemPrompt = (sender: Sender, files: ProjectFiles) => {
  const fileNames = Object.keys(files);
  const fileContext = fileNames.length > 0 
    ? Object.entries(files).map(([name, content]) => `--- CONTENU ACTUEL DU FICHIER: ${name} ---\n${content}`).join('\n\n')
    : "L'IDE EST VIDE. Initialise le projet.";

  return `IDENTITÉ : Tu es l'unité de calcul ${sender}. 
SITUATION : Tu travailles en ESSAIM avec d'autres IA connectées au WEB.

MISSION D'ASSETS (URGENT) :
- Tu DOIS utiliser de vraies images provenant d'Internet.
- Pour les images, utilise des URLs directes (ex: https://images.unsplash.com/photo-...).
- Si tu es Gemini, utilise ta fonction "Google Search" pour trouver des URLs d'images exactes correspondant au besoin du projet (ex: "sprite player", "background forest", "icon gold coin").
- N'invente pas d'URLs qui ne fonctionnent pas. Si tu as un doute, utilise "https://source.unsplash.com/featured/?keyword" en remplaçant keyword.

PROTOCOLE TECHNIQUE :
1. Examine le code actuel. 
2. Si le code utilise des carrés de couleur, REMPLACE-LES par des balises <img> ou des textures avec des URLs réelles.
3. Crée ou mets à jour les fichiers (HTML, CSS, JS) pour intégrer ces visuels.
4. Ne donne JAMAIS de fragments de code dans le chat. Utilise le format [FILE].

PROTOCOLE DE MISE À JOUR :
[FILE: nom_du_fichier.extension]
// Code complet incluant les URLs d'images réelles
[END_FILE]

ÉTAT DE LA MÉMOIRE PARTAGÉE (IDE) :
${fileContext}

AGIS MAINTENANT : Trouve des assets visuels sur le web et intègre-les dans le code.`;
};

export const parseCodeFromResponse = (text: string): { updatedFiles: ProjectFiles, cleanText: string } => {
  const updatedFiles: ProjectFiles = {};
  let cleanText = text;
  
  const fileRegex = /\[FILE:\s*([\w\d\.-]+)\]\s*\n?([\s\S]*?)\[END_FILE\]/g;
  let match;
  
  while ((match = fileRegex.exec(text)) !== null) {
    const fileName = match[1].trim();
    const content = match[2].trim();
    updatedFiles[fileName] = content;
    
    const isImageTask = content.includes('http') && (content.includes('.jpg') || content.includes('.png') || content.includes('unsplash'));
    const icon = isImageTask ? '🖼️' : '🤖';
    const label = isImageTask ? 'ASSETS WEB' : 'AUTO-DEBUG & UPDATE';
    
    cleanText = cleanText.replace(match[0], `\n\n> ${icon} **${label} : ${fileName} synchronisé avec assets.**\n`);
  }
  
  return { updatedFiles, cleanText };
};
