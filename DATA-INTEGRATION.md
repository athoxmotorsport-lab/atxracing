# ATXRACING · données ACC et ACE

## ACC aujourd'hui

Le nouveau site ne copie pas la base de production. Ses pages publiques consultent les fonctions existantes du projet Supabase `twjpjzalyvbsdpbzhqln` :

| Rubrique | Fonction publique | Données |
| --- | --- | --- |
| Courses | `public-event` | Événements publiés |
| Classement | `public-leaderboard?category=WGT,DR,BA,ALL` | Points, rythme, progression, SAFE, circuits, équipes |
| Meilleurs temps | `public-leaderboard?category=ALL` | Meilleurs tours officiels publiés |
| Profils pilotes | `public-driver?driver=<id>` | Profil public et résultats |
| Chronos détaillés | `public-driver-sectors` | Meilleurs tours et secteurs du Collector |
| Calendrier, archives, fiche course | `public-event` | Événements publiés, inscriptions et résultats |

La fonction `public-leaderboard` du dépôt ACC reste la source de vérité des calculs. Elle sépare WGT, DR et Ballade ATX, filtre les événements non publics et les sessions non officielles, et calcule les points d'équipe WorldGT. Le nouveau site affiche la réponse ; aucune importation ni nouvelle clé exposée dans le navigateur.

La publication des résultats reste assurée par le Collector ACC existant. Après son traitement, les données publiées apparaissent au prochain chargement du site. Si le résultat n'est pas visible, vérifier le statut public/officiel de l'événement et le déploiement des fonctions avant de modifier le calcul.

La connexion Steam utilise la même identité et les mêmes sessions que l'ancien site. Le bouton public demande le retour autorisé `/atxracing/fr/acc/profile.html` ; cette page transmet le code à l'entrée, qui échange le code avec `auth-session` puis ouvre `/atxracing/fr/` (« Mon paddock »). Le site statique garde temporairement le jeton dans `sessionStorage` comme l'ancien site. Le nouveau formulaire utilise `driver-profile`, les photos utilisent `upload-driver-avatar`, et `auth-session` / `auth-logout` conservent leur rôle. Le serveur historique autorise encore ses anciens chemins de retour, mais ce portail ne publie que FR et EN. Le parcours reste à vérifier avec un vrai compte Steam.

La table `driver_profile_preferences` et la fonction `driver-profile` conservent les préférences personnelles séparément des données publiques. Voir `docs/profil-pilote.md`. La page ACE n'utilise pas les résultats ACC renvoyés par l'ancienne session. Les niveaux historiques à quatre classes ne sont plus présentés comme la nouvelle échelle à cinq niveaux sur les profils ; les autres pages sportives conservent leur comportement actuel.

## Suite multi-jeu

Pour ACE, prévoir son serveur, un format de résultats et un collecteur dédié, les tables `ace_*` et la liaison des pilotes à l'identité commune. Les fonctions publiques devront accepter explicitement le jeu demandé tout en gardant le contrat actuel ACC stable. Aucun schéma ni Collector ACE n'est créé par la présente mise à jour.

Pour automatiser complètement le flux ACE, il faudra le chemin des fichiers de résultats du serveur ACE, un exemple réel du format exporté, la correspondance des identifiants de pilotes avec le compte commun et la définition des règles de classement ACE. Ne pas communiquer les clés `service_role` au site statique.
