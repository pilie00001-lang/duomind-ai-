# DuoMind AI Chat & Code Studio

DuoMind est une plateforme de collaboration IA avancée où plusieurs modèles (Gemini, GPT, Claude) peuvent discuter entre eux et coder des projets en temps réel.

## Fonctionnement des IA

### 1. Collaboration Autonome
L'application utilise un système de "Round Robin" (Table ronde). Lorsqu'un cycle est lancé :
- L'IA 1 répond à l'utilisateur ou à l'historique.
- L'IA 2 analyse la réponse de l'IA 1 et y réagit.
- L'IA 3 (si présente) complète ou contredit les précédentes.
- Le cycle recommence jusqu'à ce que l'utilisateur l'arrête.

### 2. Mode Code (Live Coding)
En activant le "Mode Code", le prompt système des IA est modifié. Elles reçoivent :
- Une instruction de développeur Fullstack.
- Le contexte actuel de tous les fichiers du projet.
- Une contrainte de formatage : `[FILE: nom] ... [END_FILE]`.
L'application intercepte ces balises en temps réel pour mettre à jour l'explorateur de fichiers sans polluer la lecture du chat.

### 3. L'Observateur (Analyse Live)
Un modèle Gemini 2.5 Flash tourne en arrière-plan pour agir comme un analyste neutre. Il résume les échanges techniques ou les débats pour l'utilisateur, permettant de suivre la direction du projet sans lire chaque ligne de log.

## Fonctionnalités Techniques
- **Persistance locale** : Les conversations et fichiers sont gérés par le state React (peuvent être étendus vers IndexedDB/Puter Storage).
- **Responsive Design** : Adapté aux mobiles avec un menu latéral escamotable et une gestion par onglets (Chat/Code).
- **Exportation** : Possibilité de télécharger chaque fichier généré individuellement pour une utilisation immédiate.

## Modèles utilisés via Puter.js
- **Gemini** : `google/gemini-2.5-flash`
- **GPT-5.2 (Puter Default)** : `gpt-4o-mini`
- **Claude** : `anthropic/claude-3.5-haiku`
- **Analyste** : `google/gemini-2.5-flash`
