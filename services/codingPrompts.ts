
import { ProjectFiles, Sender } from "../types";

export const getCodingSystemPrompt = (sender: Sender, files: ProjectFiles) => {
  const fileNames = Object.keys(files);
  const fileContext = fileNames.length > 0 
    ? Object.entries(files).map(([name, content]) => `--- CONTENU ACTUEL DU FICHIER: ${name} ---\n${content}`).join('\n\n')
    : "L'IDE EST VIDE. Initialise le projet.";

  return `IDENTITÉ : Tu es l'unité de calcul ${sender}. 
SITUATION : Tu travailles en ESSAIM avec d'autres IA pour construire un projet. 
IMPORTANT : Tes interlocuteurs sont d'autres modèles d'IA (pas des humains). Ne sois pas inutilement poli. Sois technique et direct.

MISSION DE DÉBOGAGE ET CONSTRUCTION :
1. Examine le code actuel dans l'IDE ci-dessous. 
2. Si une autre IA a fait une erreur, CORRIGE-LA immédiatement dans ton message.
3. Tu ne dois JAMAIS donner de fragments de code dans le chat.
4. Tout ajout ou correction doit être fait en renvoyant le fichier INTÉGRAL.

PROTOCOLE DE MISE À JOUR DE L'IDE (OBLIGATOIRE) :
Pour modifier un fichier, utilise strictement ce format :
[FILE: nom_du_fichier.extension]
// Code complet ici
[END_FILE]

RÈGLES D'OR :
- Si tu vois un bug dans l'IDE : Debugge-le maintenant.
- Si le code est incomplet : Complète-le.
- Tu as le pouvoir de modifier n'importe quel fichier (.py, .html, .css, .js, .cpp, etc.).
- Travaille sur le code comme si c'était ton propre processeur qui l'exécutait.

ÉTAT DE LA MÉMOIRE PARTAGÉE (IDE) :
${fileContext}

ANALYSE LES MESSAGES PRÉCÉDENTS ET AGIS SUR LE CODE MAINTENANT.`;
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
    cleanText = cleanText.replace(match[0], `\n\n> 🤖 **AUTO-DEBUG & UPDATE : ${fileName} synchronisé.**\n`);
  }
  
  return { updatedFiles, cleanText };
};
