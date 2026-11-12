# CLAUDE.md — Application d'apprentissage du français (débutants absolus)

## Mode de travail (IMPORTANT)

- **Tu n'as pas besoin de mon autorisation pour implémenter.** Ne demande pas de confirmation avant de créer, modifier ou supprimer des fichiers, d'installer des dépendances, de lancer des commandes (build, tests, serveur de dev) ou de refactorer.
- Avance de manière autonome, de bout en bout : planifie brièvement, implémente, vérifie (`ng build`, `ng test`), corrige, puis fais un court résumé.
- Ne pose une question que si une ambiguïté bloque réellement le travail et qu'aucun choix raisonnable n'existe. Sinon, prends la décision la plus simple, note-la dans le résumé final et continue.
- Ne t'arrête pas à une maquette : livre une application **fonctionnelle**.
- Seules exceptions où tu dois demander : opérations destructrices hors du projet, publication/déploiement, ou ajout d'un service externe payant.

## Objectif du projet

Application web Angular pour des personnes qui connaissent presque pas le français. Elles apprennent à reconnaître les lettres, écouter les sons et prononcer des syllabes, mots et phrases simples.

**L'objectif principal est la prononciation**, pas la grammaire ni la compréhension écrite.

**Priorité absolue : simplicité, accessibilité et apprentissage progressif de la prononciation française.**

## Contraintes techniques

- Angular + TypeScript, composants standalone, interface responsive (téléphone, tablette, ordinateur).
- CSS moderne, interface épurée.
- **Aucun** backend, authentification ou inscription.
- Progression stockée dans `localStorage`.
- Contenu pédagogique embarqué dans des fichiers JSON.
- Synthèse vocale via l'API native `speechSynthesis` / `SpeechSynthesisUtterance`, langue `fr-FR`, `rate = 0.8`.
- **Interdit** : fichiers audio (MP3, WAV…), services de synthèse vocale externes ou payants.
- **Pas** de reconnaissance vocale / microphone : ne prétends pas évaluer la prononciation de l'utilisateur.

## Architecture

```text
src/app/
├── core/services/
│   ├── audio.service.ts
│   └── progress.service.ts
├── models/
│   ├── lesson.model.ts
│   └── progress.model.ts
├── features/
│   ├── learning/
│   ├── lesson/
│   └── exercise/
├── data/
│   └── lessons.json
└── app.component.ts
```

Tu peux simplifier cette organisation, mais garde une séparation claire entre **données pédagogiques**, **synthèse vocale** et **gestion de la progression**.

### AudioService

- Vérifie la disponibilité de `speechSynthesis`.
- Charge les voix (attention : `getVoices()` peut être vide au départ, écouter `voiceschanged`) et privilégie une voix `fr-FR`.
- Appelle `cancel()` avant chaque nouvelle prononciation.
- Permet de répéter la dernière prononciation.
- Gère les erreurs et l'absence de voix française (message court et visuel, pas de crash).
- Distingue le **nom** d'une lettre (« B » → « bé ») de son **son** (/b/). Les données doivent avoir un champ de texte à prononcer distinct du texte affiché (ex. `display`, `speak`, `phoneticSpeak`).

### ProgressService

Enregistre automatiquement dans `localStorage` :
- dernière leçon consultée et étape actuelle,
- leçons terminées,
- résultats des exercices et nombre de tentatives.

À la réouverture, l'utilisateur retrouve exactement sa position. Aucune sauvegarde manuelle. Gère proprement un `localStorage` absent ou corrompu.

### Données (`lessons.json`)

Structure extensible : ajouter une leçon ne doit **jamais** nécessiter de modifier le code des composants. Chaque leçon contient un id, un titre, un type de contenu, une liste d'étapes (texte affiché, texte à prononcer, illustration/pictogramme éventuel) et ses exercices.

## Parcours pédagogique (10 leçons, dans cet ordre)

1. **Alphabet** : 26 lettres, une à la fois, majuscule/minuscule, revoir les précédentes.
2. **Voyelles** : A, E, I, O, U, Y.
3. **Consonnes** : présentées progressivement avec leurs noms.
4. **Consonne + voyelle** : BA/BE/BI/BO/BU, MA…, PA…, SA…
5. **Syllabes** : combiner des sons, répéter les précédentes.
6. **Articles définis** : LE, LA, LES, L'.
7. **Articles indéfinis** : UN, UNE, DES.
8. **Premiers mots** : MAMAN, PAPA, SALUT, BONJOUR, MERCI, MAISON, LIVRE, ÉCOLE.
9. **Groupes de mots** : BONJOUR PAPA, MA MAMAN, UNE MAISON, UN LIVRE.
10. **Premières phrases** : BONJOUR !, JE M'APPELLE…, COMMENT ÇA VA ?, JE VAIS BIEN.

## Exercices (fin de chaque petite leçon)

- **Écouter et reconnaître** : l'app prononce une lettre/syllabe, l'utilisateur choisit parmi 2–3 grandes propositions.
- **Associer** : une lettre affichée, plusieurs sons à écouter, choisir le bon.
- **Écouter et choisir** : l'app prononce un mot, l'utilisateur choisit le bon mot.

Règles : propositions très lisibles, cliquables pour être écoutées avant de répondre, consignes très courtes, vérification de la réponse avec retour visuel clair et encourageant.

## UX / UI

- Au lancement : afficher directement la dernière leçon en cours (ou la première). **Pas** de tableau de bord, connexion, inscription, choix de niveau ni menus complexes.
- **Une seule activité principale à la fois.**
- Contenu principal en très grande taille, cliquable pour déclencher la prononciation, avec indication visuelle « écoutable » (icône haut-parleur) et bouton « Réécouter ».
- Bouton large « Suivant », indicateur de progression discret.
- Très peu de texte, accompagné de pictogrammes ou d'illustrations simples.
- Couleurs douces et rassurantes, bons contrastes, animations légères.
- Mobile-first : parfaitement adapté à l'écran, cibles tactiles larges.
- Ressembler à un outil interactif, pas à une plateforme scolaire.

## Accessibilité

- Éléments interactifs en vrais `<button>`, navigables au clavier, `aria-label` en français sur les icônes.
- Focus visible, contrastes WCAG AA minimum.
- Respecter `prefers-reduced-motion`.
- Ne jamais transmettre une information uniquement par la couleur.

## Conventions de code

- TypeScript strict, pas de `any`.
- Composants standalone, signaux ou RxJS de façon cohérente, `OnPush` si pertinent.
- Un composant = une responsabilité ; logique métier dans les services.
- Textes de l'interface en français.
- Tests unitaires pour `AudioService` (avec mock de `speechSynthesis`) et `ProgressService`.

## Commandes

```bash
npm install
ng serve          # développement
ng build          # build de production
ng test           # tests unitaires
```

## Définition de « terminé »

- Les 10 leçons sont jouables avec un parcours complet.
- Cliquer sur une lettre, syllabe, mot ou phrase la prononce réellement.
- Les boutons de navigation et les exercices fonctionnent (sélection + vérification).
- La progression est sauvegardée automatiquement et reprise à la réouverture.
- `ng build` passe sans erreur, design responsive vérifié.
