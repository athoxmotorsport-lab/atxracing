# Classements ACC

Les catégories actives sont WGT (WorldGT), DR (Daily Race) et ATXS (ATX Series).
ATXS est disponible dans l'administration ; choisir compétition ATXS et format ATXS.
La durée est configurable : le futur rendez-vous de 45 minutes toutes les deux heures
n'est pas programmé automatiquement par cette modification.

Le code `competition_code` d'un événement est prioritaire. Pour les imports Collector
sans code explicite, utiliser le marqueur `ATXS` dans le nom du serveur ou de la course.
Les codes historiques BA/BATX et les titres Balade/Ballade ATX comptent dans DR.
Les courses et résultats historiques ne sont ni supprimés ni réécrits : chaque
résultat appartient à une seule catégorie et conserve ses points enregistrés.

Les vues sont « Classement par pilote » et « Classement par équipe ». Le lien d'équipe
ouvre une fiche adressable par `ranking.html?type=DR&team=...#team`. Elle affiche les
participants connus et les membres publics portant le même nom d'équipe. Un profil
privé n'est pas exposé ; un pilote non identifié par Steam n'a pas de lien de profil.

Le niveau collectif vient de la moyenne des indices de rythme de ses participants
disponibles, chaque pilote comptant une fois, même après plusieurs courses WGT.
Les points WGT restent attribués une fois par équipage et par événement.
Les statistiques des membres sont celles de la catégorie sélectionnée.

La migration `20261006180000_add_atx_series.sql` élargit les contraintes et la fonction
de publication des brouillons sans effacer de données. Elle conserve BATX pour les
archives et les brouillons existants. Un nouveau brouillon ne propose plus BATX.

Validation : `python3 scripts/verify_site.py`, `node scripts/test-ranking-categories.cjs`,
`node scripts/test-ranking-browser.cjs`, et les tests existants administration/profil.
