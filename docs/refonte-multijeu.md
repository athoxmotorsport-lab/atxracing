# ATXRACING — refonte ACC + ACE

État au 25 septembre 2026. Ce document décrit la cible et distingue les écrans réellement livrés des intégrations à venir. L'ancien dépôt `athoxmotorsport-lab/atx-racing` reste la source de vérité ACC pendant la migration. Aucune donnée Supabase ni aucun serveur de course n'est modifié par ce dépôt.

## Direction produit et visuelle

- Une bannière ATXRACING unique ouvre deux portes : moitié gauche ACC, moitié droite ACE.
- Deuxième écran : recadrage correspondant de cette même bannière, suivi de cinq **images** de drapeaux. Le drapeau définit la langue avant l'arrivée dans la ligue.
- Le même shell (logo, sélection ACC/ACE, navigation, profil) reste identifiable après l'entrée. ACC privilégie le rouge de compétition et des repères de chronométrage ; ACE emploie des surfaces acier, un contraste plus froid et le même rouge de marque pour les actions importantes. On évite deux jeux de composants à maintenir.
- Sur petit écran : bannière et sélecteur restent utilisables, navigation horizontale accessible, tableaux défilables, états vides honnêtes.
- De la référence evohub.gg, retenir la lisibilité des sessions, les cartes compactes, la séparation entre courses, classements, chronos et fiches pilotes. Aucun contenu, logo ou résultat d'EVOHUB n'est repris.

## Arborescence cible

```text
/                            Bannière / sélecteur de jeu
/acc/ et /ace/               Image du jeu + choix de langue
/{lang}/{game}/              Accueil de la ligue (lang = fr, en, de, it, es)
/{lang}/{game}/courses.html  Calendrier, types de courses, inscriptions
/{lang}/{game}/ranking.html  Classement pilotes/équipes et saison
/{lang}/{game}/records.html  Meilleurs temps par circuit, parcours pilote
/{lang}/{game}/profile.html  Profil pilote transversal, vue du jeu
Cible future : /{lang}/{game}/events/{slug}/ (règlement, résultat, stream)
Cible future : /{lang}/{game}/rules/ et /{lang}/{game}/broadcast/
Cible future : /{lang}/drivers/{driver_id}/ (identité et historique global)
```

Les pages et les cinq langues de base existent. Les routes « cible future » nécessitent leurs données et leurs traitements. L'ancien classement par circuit et le parcours pilote du dépôt ACC doivent être portés avec leur logique de filtrage ; il ne faut pas recalculer les points côté navigateur.

## Parcours clés

| Personne | Entrée | Actions attendues | État actuel |
| --- | --- | --- | --- |
| Nouveau visiteur | Bannière → moitié ACC ou ACE → drapeau | Découvrir la ligue, voir les courses puis s'inscrire | Sélecteur et pages présents ; inscription ACC renvoie vers SimGrid quand un événement public en fournit le lien |
| Pilote connecté | Même compte Steam → sélecteur de jeu dans le header | Garder pseudo et avatar, comparer classement et chronos ACC/ACE, consulter l'historique global | Identité partagée et synchronisation de session à intégrer ; la connexion de l'ancien site reste sur son domaine |
| Spectateur | Course → fiche événement | Repérer le prochain stream, ouvrir diffusion et replay liés à l'événement | Pages événements et flux de diffusion à ajouter lorsque leurs URLs fiables existent |

## Composants réutilisables

| Composant | Contenu | Règle |
| --- | --- | --- |
| `GameSwitch` | ACC / ACE avec état actif | Ne change pas le compte pilote ni la langue choisie |
| `PilotIdentity` | Avatar, pseudo, connexion Steam | Toujours relié au même `driver_id`, jamais de faux état « connecté » |
| `RaceCard` | Circuit, type, date/heure Bruxelles, durée, voiture, inscription | État sans date ou lien vérifié clairement signalé |
| `RankingTable` | Saison, catégorie, rang, pilote/équipe, points | Calcul officiel côté backend, colonnes numériques tabulaires |
| `RecordCard` | Circuit, voiture, pilote, meilleur tour valide | Chronos privés exclus ; une voiture liée au chrono |
| `LiveBanner` | Événement, plateforme, lien de diffusion, horaire | Affiché « en direct » uniquement avec signal fiable |
| `LanguageSwitch` | FR / EN / DE / IT / ES sous forme de drapeaux | URL correspondante, libellés accessibles au lecteur d'écran |

## Architecture de données proposée

1. **Identité commune :** conserver `public.drivers.id` et `public.driver_identities.driver_id` du projet Supabase ACC. Le Steam ID reste unique ; les nouveaux liens Discord doivent être ajoutés à la couche commune avec contrôle de propriété et consentement. Un pilote peut n'avoir des résultats que dans un jeu.
2. **ACC :** conserver les tables et fonctions existantes (`events`, `results`, `driver_ratings`, ingestion, classements). Les exposer derrière un contrat de lecture avec `game=acc` sans réécrire immédiatement leurs données ni changer les scores World GT. Le `game` texte existant dans `events` ne suffit pas à isoler tout le modèle de course.
3. **ACE :** créer, dans une migration revue séparément, des tables `ace_circuits`, `ace_cars`, `ace_events`, `ace_results`, `ace_laps`, `ace_ingestion_batches`, `ace_ratings` (ou un schéma privé `ace`). Les tables contenant un pilote référencent `public.drivers(id)`. Ajouter `season_id`/catégorie et les contraintes d'unicité nécessaires aux imports idempotents. Choisir préfixes ou schéma après audit des droits Data API, RLS et fonctions existantes.
4. **API publique :** lecture filtrée par `game`, saison et visibilité. Ne jamais exposer de résultat privé dans les chronos ou profils. CORS doit autoriser le domaine définitif en plus de l'ancien site ; l'origine GitHub Pages du même compte fonctionne déjà pour les fonctions publiques ACC, mais cela doit être vérifié en navigation réelle.
5. **Compte :** le retour OpenID Steam de l'ancien site cible aujourd'hui `profil-pilote.html` sur `siteUrl()`. La migration de session doit être testée sur le nouveau domaine avant toute bascule ; un lien vers l'ancien profil n'est pas une authentification transversale.

**Sécurité :** garder les privilèges d'import côté serveur/Collector, jamais de clé `service_role` dans JS public. RLS explicite pour chaque nouvelle table exposée. Les rôles de modération restent sur la couche commune, avec périmètre par jeu si nécessaire.

## Collecte ACC / ACE

Le Collector ACC en production continue de surveiller son dossier actuel. Définir une interface `gameAdapter` : `scan`, `parse`, `normalise`, `validate`, `publish`, avec deux configurations de chemins et deux journaux/curseurs de fichiers. L'adaptateur ACE dépend du format de résultats réel fourni par le serveur ACE ; **aucune compatibilité ACC → ACE n'est supposée**. Tester sur un échantillon ACE avant d'écrire dans Supabase. Rendre chaque import idempotent via identifiant fichier/session et conserver les fichiers sources pour audit. Déploiement progressif : scan ACE en lecture seule, comparaison manuelle, préproduction, puis publication.

## Livraison par étapes

| Étape | Résultat vérifiable | Dépendance |
| --- | --- | --- |
| 1. Portail et design | Bannière, image et langue, shell responsive, composants et contrôle des liens | Livré dans ce dépôt |
| 2. ACC sans rupture | Portage fidèle courses/classements/records/profil depuis l'ancien dépôt ; tests des points et confidentialité ; Steam sur le nouveau domaine | Accès API et configuration du domaine |
| 3. ACE données | Format serveur confirmé, migration Supabase et RLS, adaptateur Collector, jeux de données d'essai | Serveur ACE et exemples de résultats |
| 4. Fiches & diffusion | Fiches événement, règlement, inscription, URLs live/replay gérées | Données et canaux Twitch/YouTube décidés |
| 5. Bascule | Tests sur domaine final, redirections, SEO, surveillance, retour arrière | Étapes précédentes validées |

Le prompt mentionne Open Lobby, alors que sa suppression du site ACC a été décidée auparavant. Le modèle futur peut supporter un type de course supplémentaire, mais **aucun onglet Open Lobby n'est réactivé** dans l'interface actuelle. Le serveur Discord reste unique ; une organisation de salons partagés et de catégories par jeu peut être décidée séparément.

## Hébergement et domaine

Le générateur utilise `/atxracing/` par défaut pour GitHub Pages et copie les pages et assets générés à la racine du dépôt, qui est la source Pages actuellement configurée (`main / (root)`). Un domaine personnalisé à la racine se construit avec `ATX_BASE_PATH=/ python3 build.py`. Conserver un seul site statique et une seule origine canonique évite la fragmentation de session et de SEO. Vérifier DNS, HTTPS, URL Steam de retour, CORS, Search Console, sitemap et redirections avant de remplacer l'ancien site. Le Site privé actuel reste une prévisualisation distincte ; la publication GitHub Pages dépend de l'activation des Pages sur le nouveau dépôt.
