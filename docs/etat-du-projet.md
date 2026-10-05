# État vérifié du nouveau site ATXRACING — 5 octobre 2026

Ce document sert de point de repère pour la reprise. Il distingue ce qui a été vérifié de ce qui reste à valider. Le contexte fourni par l'utilisateur dans le projet, `refonte-multijeu.md`, `profil-pilote.md`, `admin-simgrid.md` et `transition-ancien-depot.md` restent les références de conception. Le fichier anciennement cité `prompt_chatgpt_atxracing.md` n'était plus présent à son chemin indiqué dans Downloads lors de cette vérification ; son contenu n'est donc pas tenu pour relu ici.

## Vérifié dans ce dépôt

- L'entrée Steam est bilingue ; après la connexion, le nouveau paddock propose ACC et ACE. Le fond fourni reste fixe et les pages intérieures utilisent le menu latéral. Le site généré comporte 71 pages FR/EN et passe `scripts/verify_site.py`.
- Le profil ACC comporte l'identité, les préférences, le niveau publié, la note Safe et les distinctions. La connexion Steam réelle et la sauvegarde avec le compte du propriétaire restent à contrôler manuellement.
- Les archives ACC affichent uniquement des affiches d'événements identifiés. Kyalami et Barcelone réutilisent les affiches originales retrouvées sur les événements créés dans la base ; Nürburgring GP et Monza utilisent leurs affiches historiques. Les autres affiches proviennent de l'URL enregistrée dans l'événement. Les photographies génériques de circuits ne sont plus utilisées comme affiches d'archives. La session Watkins Glen dupliquée sans événement créé est écartée de cette liste.
- Les huit affiches actuellement affichées dans les archives ont été chargées dans un navigateur de contrôle. La photo Red Bull Ring reste sur la page des meilleurs temps.
- Les notifications publiques de l'ancien site (course du jour, résultats, record) sont reprises sur les pages intérieures FR/EN. La cloche, les liens adaptés au nouveau site et le panneau Discord de droite ont été vérifiés en navigateur sur ordinateur et mobile. Le widget officiel affiche les membres en ligne. La prochaine notification Discord réelle reste à contrôler après la migration de son lien.
- La messagerie privée entre pilotes est présente dans les deux langues et accessible depuis l'en-tête. L'API vérifie la session Steam, limite les envois et permet de bloquer un pilote ; les tables interdisent la lecture directe depuis le navigateur. Les parcours d'interface ont été vérifiés avec des réponses simulées. Un échange réel entre deux comptes Steam reste à tester.
- Les deux dépôts GitHub partagent le même projet Supabase. Les sources des anciennes fonctions et migrations ont été copiées ici sans les redéployer. La suppression de l'ancien dépôt exige les vérifications listées dans `transition-ancien-depot.md`.

## À résoudre ou à confirmer

- L'import des résultats ACC peut créer une deuxième ligne d'événement distincte de la course publiée. Le rapprochement de Kyalami et Barcelone avec leurs affiches est explicite dans `src/events.js`, mais il ne fusionne pas les résultats ni les horaires dans la base. Une association durable entre session importée et événement créé est nécessaire avant de considérer l'historique comme entièrement fiable.
- Le parcours Steam réel et l'administration SimGrid avec le jeton de communauté doivent être essayés avec les comptes autorisés ; les tests automatisés utilisent des réponses simulées.
- La correspondance de chaque historique pilote avec les seules courses officielles, les données ACE, la photo détourée de chaque GT3, la formule de régularité et le seuil Challenger restent à valider ou à compléter.
- Avant toute suppression de l'ancien dépôt, vérifier les fonctions déployées, les migrations réellement appliquées, les liens de retour Steam et la prochaine livraison réelle d'une notification Discord.

## Règle de travail

Pour les archives, afficher l'affiche de l'événement créé et associé à la course. Ne pas remplacer une affiche manquante par une photo du circuit ou une image trouvée ailleurs. Vérifier la source des données avant de modifier une page voisine ; noter explicitement toute correspondance historique encore manuelle.
