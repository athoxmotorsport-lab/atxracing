# ATXRACING — refonte ACC + ACE

État au 4 octobre 2026. Ce document décrit la cible et distingue les écrans réellement livrés des intégrations à venir. L'ancien dépôt `athoxmotorsport-lab/atx-racing` reste une référence pour les données ACC pendant la migration.

## Direction produit et visuelle

- L'entrée publique affiche le message Steam en français puis en anglais, dans un ordre miroir, sans logo, en-tête ni pied de page. Les textes correspondants ont la même taille.
- Après connexion, « Mon paddock » ouvre deux grandes cartes illustrées ACC et ACE ; le lien « À propos » reste accessible. La bannière à trois zones n'est plus l'accueil après connexion.
- Le fond de circuit fourni reste fixe derrière toutes les pages. Les surfaces du contenu l'assombrissent légèrement pour maintenir la lisibilité sans masquer l'image.
- Le choix FR/EN par drapeaux se fait dans l'en-tête des pages intérieures ; aucun sélecteur de langue ne s'interpose après la bannière.
- Le même shell (logo, sélection ACC/ACE, navigation, profil) reste identifiable après l'entrée. ACC privilégie le rouge de compétition et des repères de chronométrage ; ACE emploie des surfaces acier, un contraste plus froid et le même rouge de marque pour les actions importantes. On évite deux jeux de composants à maintenir.
- Sur petit écran : les trois zones de la bannière restent cliquables et trois liens explicites apparaissent dessous ; navigation horizontale accessible, tableaux défilables, états vides honnêtes.
- De la référence evohub.gg, retenir la lisibilité des sessions, les cartes compactes, la séparation entre courses, classements, chronos et fiches pilotes. Aucun contenu, logo ou résultat d'EVOHUB n'est repris.

## Arborescence cible

```text
/                            Entrée Steam bilingue
/{lang}/                     Mon paddock après connexion, cartes ACC / ACE
/acc/ et /ace/               Redirection des anciens liens vers /fr/{game}/
/{lang}/about.html           Page À propos (contenu à venir)
/{lang}/{game}/              Accueil de la ligue (lang = fr ou en)
/{lang}/{game}/courses.html  Calendrier, types de courses, inscriptions
/{lang}/{game}/ranking.html  Classement pilotes/équipes et saison
/{lang}/{game}/records.html  Meilleurs temps par circuit, parcours pilote
/{lang}/{game}/profile.html  Profil pilote transversal, vue du jeu
Cible future : /{lang}/{game}/events/{slug}/ (règlement, résultat, stream)
Cible future : /{lang}/{game}/rules/ et /{lang}/{game}/broadcast/
Cible future : /{lang}/drivers/{driver_id}/ (identité et historique global)
```

Les pages FR et EN sont générées. Les routes « cible future » nécessitent leurs données et leurs traitements. Il ne faut pas recalculer les points côté navigateur.

## Parcours clés

| Personne | Entrée | Actions attendues | État actuel |
| --- | --- | --- | --- |
| Nouveau visiteur | Entrée bilingue → connexion Steam | Ouvrir le nouveau paddock, choisir ACC ou ACE et créer son profil | L'entrée exige une session avant les pages intérieures ; le retour Steam réel reste à valider avec un compte |
| Pilote connecté | « Mon paddock » → ACC ou ACE | Garder pseudo et avatar, comparer classement et chronos ACC/ACE, consulter l'historique global | Identité Steam commune sur le nouveau site ; données sportives ACE et historique global à intégrer |
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
| `LanguageSwitch` | FR / EN sous forme de drapeaux dans l'en-tête et le pied de page | URL correspondante, libellés accessibles au lecteur d'écran |

## Architecture de données proposée

1. **Identité commune :** conserver `public.drivers.id` et `public.driver_identities.driver_id` du projet Supabase ACC. Le Steam ID reste unique ; les nouveaux liens Discord doivent être ajoutés à la couche commune avec contrôle de propriété et consentement. Un pilote peut n'avoir des résultats que dans un jeu.
2. **ACC :** conserver les tables et fonctions existantes (`events`, `results`, `driver_ratings`, ingestion, classements). Les exposer derrière un contrat de lecture avec `game=acc` sans réécrire immédiatement leurs données ni changer les scores World GT. Le `game` texte existant dans `events` ne suffit pas à isoler tout le modèle de course.
3. **ACE :** créer, dans une migration revue séparément, des tables `ace_circuits`, `ace_cars`, `ace_events`, `ace_results`, `ace_laps`, `ace_ingestion_batches`, `ace_ratings` (ou un schéma privé `ace`). Les tables contenant un pilote référencent `public.drivers(id)`. Ajouter `season_id`/catégorie et les contraintes d'unicité nécessaires aux imports idempotents. Choisir préfixes ou schéma après audit des droits Data API, RLS et fonctions existantes.
4. **API publique :** lecture filtrée par `game`, saison et visibilité. Ne jamais exposer de résultat privé dans les chronos ou profils. CORS doit autoriser le domaine définitif en plus de l'ancien site ; l'origine GitHub Pages du même compte fonctionne déjà pour les fonctions publiques ACC, mais cela doit être vérifié en navigation réelle.
5. **Compte :** la fonction Steam existante accepte `/atxracing/fr/acc/profile.html` comme chemin de retour, mais refusait `/atxracing/` et renvoyait alors vers l'ancien profil. Le nouveau bouton emploie le chemin autorisé ; la page de profil transfère le code à l'entrée, qui échange le code puis ouvre « Mon paddock ». Ce parcours est testé avec une réponse de session simulée ; une connexion Steam complète doit encore être validée par le titulaire du compte.

**Sécurité :** garder les privilèges d'import côté serveur/Collector, jamais de clé `service_role` dans JS public. RLS explicite pour chaque nouvelle table exposée. Les rôles de modération restent sur la couche commune, avec périmètre par jeu si nécessaire.

## Collecte ACC / ACE

Le Collector ACC en production continue de surveiller son dossier actuel. Définir une interface `gameAdapter` : `scan`, `parse`, `normalise`, `validate`, `publish`, avec deux configurations de chemins et deux journaux/curseurs de fichiers. L'adaptateur ACE dépend du format de résultats réel fourni par le serveur ACE ; **aucune compatibilité ACC → ACE n'est supposée**. Tester sur un échantillon ACE avant d'écrire dans Supabase. Rendre chaque import idempotent via identifiant fichier/session et conserver les fichiers sources pour audit. Déploiement progressif : scan ACE en lecture seule, comparaison manuelle, préproduction, puis publication.

## Livraison par étapes

| Étape | Résultat vérifiable | Dépendance |
| --- | --- | --- |
| 1. Portail et design | Entrée Steam bilingue, accueil « Mon paddock » à deux cartes, fond fixe, langues dans l'en-tête et menu d'icônes | Livré dans ce dépôt ; validation Steam réelle encore nécessaire |
| 2. ACC sans rupture | Portage fidèle courses/classements/records/profil depuis l'ancien dépôt ; tests des points et confidentialité ; Steam sur le nouveau domaine | Accès API et configuration du domaine |
| 3. ACE données | Format serveur confirmé, migration Supabase et RLS, adaptateur Collector, jeux de données d'essai | Serveur ACE et exemples de résultats |
| 4. Fiches & diffusion | Fiches événement, règlement, inscription, URLs live/replay gérées | Données et canaux Twitch/YouTube décidés |
| 5. Bascule | Tests sur domaine final, redirections, SEO, surveillance, retour arrière | Étapes précédentes validées |

Le prompt mentionne Open Lobby, alors que sa suppression du site ACC a été décidée auparavant. Le modèle futur peut supporter un type de course supplémentaire, mais **aucun onglet Open Lobby n'est réactivé** dans l'interface actuelle. Le serveur Discord reste unique ; une organisation de salons partagés et de catégories par jeu peut être décidée séparément.

## Hébergement et domaine

Le générateur utilise `/atxracing/` par défaut pour GitHub Pages et copie les pages et assets générés à la racine du dépôt, qui est la source Pages actuellement configurée (`main / (root)`). Un domaine personnalisé à la racine se construit avec `ATX_BASE_PATH=/ python3 build.py`. Conserver un seul site statique et une seule origine canonique évite la fragmentation de session et de SEO. Vérifier le retour Steam réel, DNS, HTTPS, CORS, Search Console, sitemap et redirections avant de remplacer l'ancien site. GitHub Pages est actif pour ce dépôt.
