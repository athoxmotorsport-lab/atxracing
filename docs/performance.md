# Navigation et médias

- Le fond affiché est `site-background.webp` (299 Ko au lieu de 2,75 Mo). Le JPG
  original reste disponible dans le dépôt, mais n'est plus chargé par le CSS.
- La Bentley Continental GT3 (2018) utilise un visuel blanc généré, avec transparence,
  optimisé en WebP (111 Ko). Elle est aussi proposée dans le profil pilote.
- `auth-session?view=identity` vérifie la session et son expiration côté serveur,
  puis renvoie uniquement l'identité et la confirmation du profil. Il ne charge pas
  l'historique des courses. Les pages autres que le profil utilisent cette réponse.
- Le header et la page partagent une même promesse de validation Steam. Le profil
  conserve sa réponse complète, et la session est vérifiée à chaque navigation.
- Les classements publics se réutilisent dans le même onglet pendant au plus
  60 secondes à partir de leur date de génération. Les catégories restent séparées.
  Les requêtes simultanées sont partagées, les erreurs ne sont pas mises en cache.
- Une modification du profil ou de l'avatar invalide ce cache public. Aucune donnée
  privée ni validation de session n'est conservée dans ce cache de classements.
- Un cache serveur de 60 secondes peut partager une génération si Supabase réutilise
  le même worker ; ce comportement n'est pas garanti. Le premier appel Supabase
  reste susceptible de prendre plusieurs secondes. Le cache navigateur réduit
  surtout les rechargements pendant la navigation, pas la première génération.

Tests : `test-session-identity.cjs`, `test-public-data-cache.cjs`,
`test-leaderboard-cache.cjs`, `test-circuits-browser.cjs` et les tests FR/EN
existants pour l'entrée Steam, les profils et les classements.
