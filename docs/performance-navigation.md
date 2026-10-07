# Chargement des pages

Les liens CSS et JavaScript portent une révision calculée à partir de leur contenu. Une modification charge la nouvelle version, tandis que les fichiers identiques restent réutilisables dans le cache du navigateur.

Le 7 octobre 2026, le calendrier et le classement ALL répondaient chacun en environ 3,3 secondes depuis l’environnement cloud. Ces mesures réseau ponctuelles dépendent de la région et du démarrage des fonctions ; elles ne constituent pas une garantie de temps de réponse.

La navigation masquait auparavant toute la page pendant la vérification Steam. Une page statique publique s’affiche désormais pendant ce contrôle, exécuté à chaque navigation. Sans jeton, le visiteur retourne à l’entrée ; une session expirée est supprimée ; un profil incomplet est dirigé vers son formulaire. Les endpoints privés continuent de vérifier l’authentification et les droits côté serveur. Une panne temporaire conserve le jeton et propose de réessayer.

Le contrôle de session utilise la réponse légère `auth-session?view=identity`, y compris sur le profil. Le profil privé regroupe préférences, résultats, statistiques, Safe et distinctions dans `driver-profile` ; il ne dépend plus du chargement complet de statistiques dans la réponse de session. La présence `last_seen_at` est mise à jour au plus toutes les cinq minutes, tandis que l’expiration et la révocation sont contrôlées à chaque requête.

`ATX_PUBLIC_EVENTS` partage les requêtes du calendrier, des notifications et des médias et conserve uniquement les réponses publiques dans sessionStorage pendant 30 secondes. Les archives et les détails ont leurs entrées séparées. Les erreurs ne sont jamais conservées. Publication, modification des médias, activation des inscriptions et changement du profil invalident le cache. Les classements publics conservent leur cache de 60 secondes. Les identités de session, formulaires privés, messages et exports ne sont pas mis en cache.

La réponse `public-event?view=feed` charge les événements, notifications et médias en parallèle, puis vérifie la visibilité des événements et pilotes mentionnés. Elle ne lit aucun résultat de course. Les archives restent accessibles via la réponse complète. Les lectures indépendantes du classement (pilotes, identités, résultats et sessions ACC) sont parallélisées. Les métadonnées Steam manquantes sont rafraîchies en arrière-plan par `EdgeRuntime.waitUntil`, avec délais réseau limités ; les données déjà enregistrées servent à l’affichage.

Le compteur de messages utilise `driver-messages?view=unread`, une requête de comptage pour le destinataire authentifié, sans télécharger de corps de message ni de conversation. Les vues de messagerie existantes sont conservées.

Les polices Inter, Rajdhani et IBM Plex Mono sont servies localement en WOFF2 (latin et latin étendu), avec `font-display: swap`. Sources : [Google Fonts](https://github.com/google/fonts), distributions officielles de fonts.gstatic.com. Les licences SIL OFL figurent dans `media/fonts/`. L’image transparente des niveaux utilise WebP, environ 446 Ko au lieu de 2,3 Mo ; la source PNG reste conservée.

Vérification : `scripts/test-navigation-performance.cjs` compare la porte précédente à la nouvelle sous une réponse Steam retardée de 1,2 seconde, contrôle les requêtes lors de trois navigations, la redirection des sessions expirées, les pannes temporaires et l’onboarding. Les tests `test-event-cache.cjs`, `test-event-feed.mjs` et `test-unread-badge.mjs` couvrent fraîcheur, visibilité publique et absence de messages dans le compteur. Les tests profil, entrée Steam, notifications, inscriptions, classements et circuits couvrent les régressions visuelles et fonctionnelles.
