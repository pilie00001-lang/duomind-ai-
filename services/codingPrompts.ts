
import { ProjectFiles, Sender } from "../types";

export const getDiscussionSystemPrompt = (sender: Sender) => {
  return `Tu es l'unité ${sender}, analyste stratégique du DuoMind IDE.
  
OBJECTIFS :
1. Analyse l'architecture globale du projet importé.
2. Identifie les goulots d'étranglement ou les bugs potentiels dans la logique multi-fichiers.
3. Propose des refactorisations propres.
4. Pas de code ici, uniquement de la haute stratégie.`;
};

export const getCodingSystemPrompt = (sender: Sender, files: ProjectFiles) => {
  const fileNames = Object.keys(files);
  const structure = fileNames.join('\n');
  
  // On limite le contexte envoyé pour ne pas exploser les tokens si le projet est immense, 
  // mais on donne toujours la structure complète.
  const fileContext = Object.entries(files).map(([name, content]) => `
[PATH:${name}]
${content.length > 10000 ? content.substring(0, 10000) + "... [TRONQUÉ]" : content}
[END_PATH]`).join('\n');

  return `Tu es l'unité ${sender}, ARCHITECTE SYSTÈME SENIOR.

VOTRE POUVOIR :
Vous travaillez dans un environnement de fichiers hiérarchiques complet. Vous avez accès à l'arborescence entière du projet de l'utilisateur.

DIRECTIVES TECHNIQUES :
1. **Analyse de Structure** : Avant de coder, regarde la liste des fichiers ci-dessous. Comprends l'organisation (ex: dossier 'src', 'assets', 'lib').
2. **Création de Dossiers** : Pour créer un fichier dans un nouveau dossier, utilise simplement le chemin : [FILE:dossier/sous-dossier/nouveau.js].
3. **Intégrité** : Si tu modifies une fonction dans un fichier, assure-hui que les fichiers qui l'importent ne sont pas cassés.

ARBORESCENCE DU PROJET :
${structure}

RÈGLES CRITIQUES :
- Format de réponse OBLIGATOIRE :
  [FILE:chemin/complet/du/fichier.ext]
  (CONTENU INTÉGRAL ET CORRIGÉ)
  [END_FILE]
- Ne fournis JAMAIS de code partiel. Réécris tout le fichier.
- Si le projet est un jeu, assure-toi que l'index.html pointe vers les bons chemins de scripts.

CONTEXTE SOURCE :
${fileContext}
`;
};

export const parseCodeFromResponse = (text: string): { updatedFiles: ProjectFiles, cleanText: string } => {
  const updatedFiles: ProjectFiles = {};
  let cleanText = text;
  
  // Supporte les chemins avec des caractères spéciaux et des dossiers
  const fileRegex = /\[FILE:\s*([^\s\]]+)\]\s*\n?([\s\S]*?)\[END_FILE\]/g;
  let match;
  
  while ((match = fileRegex.exec(text)) !== null) {
    const fileName = match[1].trim();
    let content = match[2].trim();
    
    // Nettoyage des blocs de code markdown potentiels à l'intérieur des balises
    if (content.startsWith('```')) {
        const lines = content.split('\n');
        // On enlève la première ligne (ex: ```javascript) et la dernière (```)
        if (lines[0].startsWith('```') && lines[lines.length-1].startsWith('```')) {
           content = lines.slice(1, -1).join('\n');
        }
    }

    // Protection contre les placeholders
    if (!content.includes("...") && !content.includes("// code existant") && !content.includes("/* rest of code")) {
        updatedFiles[fileName] = content;
    }

    cleanText = cleanText.replace(match[0], `\n> 🚀 **IA [DEPLOY] : Mise à jour de [${fileName}] effectuée.**\n`);
  }
  
  return { updatedFiles, cleanText };
};
