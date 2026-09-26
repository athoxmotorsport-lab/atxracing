# ATXRACING · ACC + ACE

Portail statique multijeu. Entrée par la bannière, choix du jeu puis de la langue.

- Source : `build.py`, `content.py`, `src/site.css`, `src/site.js`, `src/ranking.js`, `src/circuit-images.js`, `src/events.js`, `src/account.js`, `docs/refonte-multijeu.md`.
- Sortie GitHub Pages : `dist/` et miroir généré à la racine (Pages est configuré sur `main / (root)`, chemins `/atxracing/`). Exécuter `python3 build.py`, puis `node --check dist/assets/site.min.js` et `python3 scripts/verify_site.py`.
- Domaine personnalisé à la racine : `ATX_BASE_PATH=/ python3 build.py` ; revenir au préfixe GitHub Pages avec `python3 build.py`.
- Les pages ACC utilisent les fonctions publiques du projet Supabase existant. Le compte Steam et le profil pilote sont partagés entre ACC et ACE grâce aux fonctions Auth du même projet. Les courses et classements ACE attendent encore un collecteur et leurs propres tables.

Le workflow vérifie le site généré et son miroir à la racine. Les tests `scripts/test-assets.mjs` de l'ancien dépôt restent associés à ses 14 pages et ne doivent pas être copiés tels quels ici.
