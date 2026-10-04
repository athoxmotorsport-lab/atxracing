# ATXRACING · ACC + ACE

Portail statique ACC / ACE, en français et en anglais. La première page présente la connexion Steam sur la photo de circuit fournie, sans logo, en-tête ni pied de page. Après connexion, la bannière mène à ACC, À propos ou ACE. Les pages intérieures disposent d'un menu latéral à icônes et de drapeaux français et britannique dans l'en-tête. La photo reste fixe derrière le contenu.

La porte d'entrée vérifie la session Steam existante côté navigateur. GitHub Pages restant un hébergement statique, ce contrôle guide la navigation mais ne protège pas les pages ou données publiques contre un accès direct hors navigateur ; les données privées restent protégées par les fonctions Supabase.

- Source : `build.py`, `content.py`, `src/site.css`, `src/entry.js`, `src/gate.js`, `src/site.js`, `src/ranking.js`, `src/circuit-images.js`, `src/events.js`, `src/account.js`, `src/admin.js`, `media/`, `docs/refonte-multijeu.md`.
- Sortie GitHub Pages : `dist/` et miroir généré à la racine (Pages est configuré sur `main / (root)`, chemins `/atxracing/`). Exécuter `python3 build.py`, puis `node --check dist/assets/site.min.js` et `python3 scripts/verify_site.py`.
- Domaine personnalisé à la racine : `ATX_BASE_PATH=/ python3 build.py` ; revenir au préfixe GitHub Pages avec `python3 build.py`.
- Les pages ACC utilisent les fonctions publiques du projet Supabase existant. Le compte Steam et le profil pilote sont partagés entre ACC et ACE grâce aux fonctions Auth du même projet. Les courses et classements ACE attendent encore un collecteur et leurs propres tables.

Le workflow vérifie le site généré et son miroir à la racine. Les tests `scripts/test-assets.mjs` de l'ancien dépôt restent associés à ses 14 pages et ne doivent pas être copiés tels quels ici.

## Profil pilote

Connexion Steam existante, puis trois étapes : identité (pseudo et nom public), préférences (équipe, numéro, GT3, ACC/ACE pratiqués ou à découvrir), confirmation. Les préférences sont facultatives pour permettre l'inscription d'un débutant. Les initiales servent d'avatar en l'absence de photo. Un brouillon local par compte survit aux changements de langue et de jeu ; l'enregistrement confirmé passe par `driver-profile`.

Le profil ACC conserve son historique. ACE ne présente pas les statistiques ACC comme les siennes. L’illustration fournie représente les cinq niveaux ; elle n’est pas une jauge de complétion. Aucun nouveau seuil ni calcul Safe n’est défini : rythme « En évaluation », régularité et Safe en attente de règles validées, sur les profils privés et publics.

Le backend ajouté est documenté dans [docs/profil-pilote.md](docs/profil-pilote.md). Il utilise les sessions Steam existantes et une table de préférences privée, sans changer le collecteur, les résultats ou les identités Steam.

## Administration des courses

Le panel ACC FR/EN permet de lire un championnat SimGrid, préparer chaque manche en brouillon privé, puis publier une course après vérification. La lecture peut être bloquée par SimGrid ; la saisie manuelle reste disponible et l'échec est explicite. Voir [docs/admin-simgrid.md](docs/admin-simgrid.md). Les formats officiels sont vérifiés à la publication ; l'import seul ne publie jamais.

Vérifications supplémentaires (Node 22.18+ / 24) :

```text
node --test scripts/test-profile-validation.mjs
node --experimental-strip-types --test scripts/test-profile-edge.mjs
node scripts/test-profile-browser.cjs
```

Le test navigateur nécessite `playwright` disponible dans `NODE_PATH` et Chrome (`CHROME_PATH` permet d'en préciser le chemin). Il simule les services distants et n'écrit aucun compte réel. Captures de contrôle dans `.local/`, non versionnées. Sous Windows, activer `PYTHONUTF8=1` avant de lancer la génération.
