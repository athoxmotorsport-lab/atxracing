# ATXRACING · ACC + ACE

Portail statique ACC / ACE, en français et en anglais. La première page présente la connexion Steam sur la photo de circuit fournie, sans logo, en-tête ni pied de page. Après connexion, « Mon paddock » propose ACC et ACE ; la page À propos est accessible depuis la navigation. Les pages intérieures disposent d'un menu latéral à icônes et de drapeaux français et britannique dans l'en-tête. La photo reste fixe derrière le contenu.

La porte d'entrée vérifie la session Steam existante côté navigateur. GitHub Pages restant un hébergement statique, ce contrôle guide la navigation mais ne protège pas les pages ou données publiques contre un accès direct hors navigateur ; les données privées restent protégées par les fonctions Supabase.

Compétitions : World GT Sprint et Endurance ont leurs pages dédiées ; Daily Race propose 60 ou 90 minutes. ATX Series remplace Ballade dans les formats actifs, avec un programme préparé toutes les 90 minutes et des inscriptions Steam sur le site. Voir [les inscriptions et exports ACC](docs/inscriptions-acc.md) pour le catalogue de modèles serveur, les équipages, les exports administrateur CSV/JSON et le déploiement.

- Source : `build.py`, `content.py`, `src/site.css`, `src/entry.js`, `src/gate.js`, `src/site.js`, `src/ranking.js`, `src/circuit-images.js`, `src/events.js`, `src/account.js`, `src/admin.js`, `media/`, `docs/refonte-multijeu.md`.
- Sortie GitHub Pages : `dist/` et miroir généré à la racine (Pages est configuré sur `main / (root)`, chemins `/atxracing/`). Exécuter `python3 build.py`, puis `node --check dist/assets/site.min.js` et `python3 scripts/verify_site.py`.
- Domaine personnalisé à la racine : `ATX_BASE_PATH=/ python3 build.py` ; revenir au préfixe GitHub Pages avec `python3 build.py`.
- Les pages ACC utilisent les fonctions publiques du projet Supabase existant. Le compte Steam et le profil pilote sont partagés entre ACC et ACE grâce aux fonctions Auth du même projet. Les courses et classements ACE attendent encore un collecteur et leurs propres tables.

Les sources Supabase encore propres à l'ancien dépôt ACC ont été conservées ici. Les migrations propres aux notifications et aux messages privés du nouveau site ont été appliquées ; elles sont décrites dans [docs/transition-ancien-depot.md](docs/transition-ancien-depot.md) et [docs/messages-prives.md](docs/messages-prives.md). Le contrôle à effectuer avant la suppression de l'ancien dépôt reste nécessaire.

Le workflow vérifie le site généré et son miroir à la racine. Les tests `scripts/test-assets.mjs` de l'ancien dépôt restent associés à ses 14 pages et ne doivent pas être copiés tels quels ici.

## Profil pilote

Connexion Steam existante, puis trois étapes : identité (pseudo et nom public), préférences (équipe, numéro, GT3, ACC/ACE pratiqués ou à découvrir), confirmation. Les préférences sont facultatives pour permettre l'inscription d'un débutant. Les initiales servent d'avatar en l'absence de photo. Un brouillon local par compte survit aux changements de langue et de jeu ; l'enregistrement confirmé passe par `driver-profile`.

Le profil ACC conserve son historique. ACE ne présente pas les statistiques ACC comme les siennes. L’illustration fournie représente les cinq niveaux, avec le niveau ACC publié affiché dans l’en-tête. La note Safe et les distinctions proviennent des données sportives publiées ; la régularité et le seuil Challenger restent à définir.

Le backend ajouté est documenté dans [docs/profil-pilote.md](docs/profil-pilote.md). Il utilise les sessions Steam existantes et une table de préférences privée, sans changer le collecteur, les résultats ou les identités Steam.

La GT3 préférée apparaît avec une création ATXRACING détourée dans le profil personnel et la carte publique. Les 17 visuels optimisés sont stockés dans `media/gt3/` puis copiés vers `assets/gt3/` par le build ; la migration `20261006100000_atxracing_gt3_artwork.sql` remplace les anciennes photographies externes du catalogue.

## Administration des courses

Le panel Administration ATX Racing ACC FR/EN permet de créer les courses en brouillon, puis de les publier après vérification. ATX Series utilise exclusivement les inscriptions du site, la photo automatique du circuit et le format 2/15/45 minutes. Aucun lien SimGrid ni affiche n’est demandé pour ATX Series. Voir [docs/admin-simgrid.md](docs/admin-simgrid.md).

L'état vérifié et les points encore ouverts sont suivis dans [docs/etat-du-projet.md](docs/etat-du-projet.md).

Les pages intérieures affichent les notifications publiques de course, résultats et records dans une cloche de l'en-tête. Le rappel de course du jour reprend le comportement de l'ancien site. Le panneau Discord à droite charge le widget officiel seulement quand on l'ouvre ; il indique les membres en ligne et propose l'accès au serveur. Ce widget ne fournit pas de messagerie privée entre pilotes.

L'enveloppe de l'en-tête ouvre les messages privés entre pilotes Steam. La messagerie est commune à ACC et ACE, avec recherche de profils publics, compteur de messages non lus et blocage. Les messages restent réservés aux participants ; ils ne sont pas chiffrés de bout en bout. Un essai réel avec deux comptes Steam est encore nécessaire.

Vérifications supplémentaires (Node 22.18+ / 24) :

```text
node --test scripts/test-profile-validation.mjs
node --experimental-strip-types --test scripts/test-profile-edge.mjs
node scripts/test-profile-browser.cjs
```

Le test navigateur nécessite `playwright` disponible dans `NODE_PATH` et Chrome (`CHROME_PATH` permet d'en préciser le chemin). Il simule les services distants et n'écrit aucun compte réel. Captures de contrôle dans `.local/`, non versionnées. Sous Windows, activer `PYTHONUTF8=1` avant de lancer la génération.
