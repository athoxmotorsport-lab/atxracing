# ATXRACING · ACC + ACE

Portail statique multijeu. Entrée par la bannière, choix du jeu puis de la langue.

- Source : `build.py`, `src/site.css`, `src/site.js`, `docs/refonte-multijeu.md`.
- Sortie GitHub Pages : `dist/` (chemins `/atxracing/`). Exécuter `python3 build.py`, puis `node --check dist/assets/site.min.js` et `python3 scripts/verify_site.py`.
- Domaine personnalisé à la racine : `ATX_BASE_PATH=/ python3 build.py` ; revenir au préfixe GitHub Pages avec `python3 build.py`.
- Les contenus ACC viennent des fonctions publiques du projet Supabase existant. Les données ACE et le compte transversal ne sont pas encore migrés. L'ancien site ACC reste la référence opérationnelle.

Le workflow vérifie le site généré. Les tests `scripts/test-assets.mjs` de l'ancien dépôt restent associés à ses 14 pages et ne doivent pas être copiés tels quels ici.
