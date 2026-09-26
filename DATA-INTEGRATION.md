# ATXRACING · données ACC et ACE

## ACC aujourd'hui

Le nouveau site ne copie pas la base de production. Ses pages publiques consultent les fonctions existantes du projet Supabase `twjpjzalyvbsdpbzhqln` :

| Rubrique | Fonction publique | Données |
| --- | --- | --- |
| Courses | `public-event` | Événements publiés |
| Classement | `public-leaderboard?category=WGT,DR,BA,ALL` | Points, rythme, progression, SAFE, circuits, équipes |
| Meilleurs temps | `public-leaderboard?category=ALL` | Meilleurs tours officiels publiés |
| Profils pilotes | `public-driver?driver=<id>` | Profil public et résultats |

La fonction `public-leaderboard` du dépôt ACC reste la source de vérité des calculs. Elle sépare WGT, DR et Ballade ATX, filtre les événements non publics et les sessions non officielles, et calcule les points d'équipe WorldGT. Le nouveau site affiche la réponse ; aucune importation ni nouvelle clé exposée dans le navigateur.

La publication des résultats reste assurée par le Collector ACC existant. Après son traitement, les données publiées apparaissent au prochain chargement du site. Si le résultat n'est pas visible, vérifier le statut public/officiel de l'événement et le déploiement des fonctions avant de modifier le calcul.

## Suite multi-jeu

Pour ACE, prévoir son serveur, un format de résultats et un collecteur dédié, les tables `ace_*` et la liaison des pilotes à l'identité commune. Les fonctions publiques devront accepter explicitement le jeu demandé tout en gardant le contrat actuel ACC stable. Aucun schéma ni Collector ACE n'est créé par la présente mise à jour.

Pour automatiser complètement le flux ACE, il faudra le chemin des fichiers de résultats du serveur ACE, un exemple réel du format exporté, la correspondance des identifiants de pilotes avec le compte commun et la définition des règles de classement ACE. Ne pas communiquer les clés `service_role` au site statique.
