# Transition depuis `atx-racing`

Les deux sites utilisent le même projet Supabase (`twjpjzalyvbsdpbzhqln`). Un dépôt GitHub est une copie du code, pas l'hébergement de la base : supprimer l'ancien dépôt ne supprimerait pas les comptes, les courses ou les résultats. En revanche, déployer une fonction Edge de même nom depuis l'un ou l'autre dépôt remplace la version exécutée pour les deux sites. Les changements de schéma affectent également les deux sites.

Le 5 octobre 2026, les dix fonctions et les vingt migrations qui n'existaient que dans l'ancien dépôt ont été copiées ici, sans exécution de migration ni déploiement. Les quatre fonctions déjà présentes dans ce dépôt (`auth-session`, `public-driver`, `public-driver-sectors`, `public-event`) ont gardé leur version actuelle. Les utilitaires partagés ont été comparés : leur seule différence avec l'ancien dépôt est une ligne vide finale. Cette copie conserve le code nécessaire pour poursuivre le développement après la disparition de l'ancien dépôt ; elle ne prouve pas à elle seule que chaque fichier correspond exactement à la version actuellement déployée dans Supabase.

Avant de supprimer l'ancien dépôt :

1. Vérifier la liste des migrations appliquées sur le projet Supabase et la comparer à `supabase/migrations/`.
2. Vérifier les versions déployées des fonctions, puis tester le parcours Steam, l'import ACC, le collecteur, les classements, les notifications et l'administration depuis le nouveau site.
3. Changer le repli de `auth-steam` (`OLD_PROFILE`) : il mène encore à `/atx-racing/profil-pilote.html` pour les connexions sans `return_path`. Le nouveau site transmet déjà son propre `return_path`.
4. Modifier les liens de notifications Discord générés par le déclencheur introduit dans `20260920120000_discord_cloud_notifications.sql` ; ils pointent encore vers `/atx-racing/`. Cela nécessite une nouvelle migration, sans modifier l'ancienne migration historique.
5. Vérifier que les automatisations et intégrations externes du collecteur ACC n'utilisent pas de fichiers hébergés par l'ancien dépôt. Le point d'entrée Supabase `ingest-acc-results` reste disponible indépendamment du dépôt GitHub.
6. Vérifier les liens vers l'ancien site dans la documentation et la navigation, puis supprimer l'ancien dépôt seulement après ces contrôles.

Les affiches historiques conservées dans `media/events/` et la photo Red Bull Ring conservée dans `media/circuits/` sont servies par le nouveau site. Les affiches publiées dans Supabase Storage ne dépendent pas de l'ancien dépôt GitHub.
