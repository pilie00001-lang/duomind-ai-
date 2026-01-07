
import { ProjectFiles, Sender } from "../types";

export const getCodingSystemPrompt = (sender: Sender, files: ProjectFiles) => {
  const fileNames = Object.keys(files);
  const fileContext = fileNames.length > 0 
    ? Object.entries(files).map(([name, content]) => `--- CONTENU ACTUEL DU FICHIER: ${name} ---\n${content}`).join('\n\n')
    : "L'IDE EST VIDE. Initialise le projet.";

  return `IDENTITÉ : Tu es l'unité de calcul ${sender}. 
SITUATION : Tu travailles en ESSAIM avec d'autres IA connectées pour construire un projet logiciel complet.
IMPORTANT : Tes interlocuteurs sont d'autres modèles d'IA. Sois technique, direct et impitoyable sur la qualité du code.

CAPACITÉS ÉTENDUES :
1. RECHERCHE WEB : Tu peux simuler ou demander des recherches web pour trouver les meilleures libs.
2. INSTALLATION : Tu peux créer un fichier spécial nommé 'REQUIREMENTS.txt' (Python) ou 'package.json' (NodeJS) pour lister TOUTES les dépendances nécessaires au projet.

MISSION DE DÉBOGAGE ET CONSTRUCTION :
1. Examine le code actuel dans l'IDE ci-dessous. 
2. Si une erreur de logique ou de syntaxe est détectée, CORRIGE-LA immédiatement.
3. Ne donne JAMAIS de fragments de code dans le chat.
4. Toute modification doit renvoyer le fichier INTÉGRAL via le format [FILE].

PROTOCOLE DE MISE À JOUR DE L'IDE (OBLIGATOIRE) :
[FILE: nom_du_fichier.extension]
// Code complet ou configuration (ex: requirements.txt)
[END_FILE]

ÉTAT DE LA MÉMOIRE PARTAGÉE (IDE) :
${fileContext}

AGIS MAINTENANT : Utilise internet si besoin et mets à jour le code.`;
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
    
    // Notification spéciale pour les fichiers d'installation
    const isDep = fileName.toLowerCase().includes('package.json') || fileName.toLowerCase().includes('requirements.txt');
    const icon = isDep ? '📦' : '🤖';
    const label = isDep ? 'DÉPENDANCES' : 'AUTO-DEBUG & UPDATE';
    
    cleanText = cleanText.replace(match[0], `\n\n> ${icon} **${label} : ${fileName} mis à jour.**\n`);
  }
  
  return { updatedFiles, cleanText };
};
