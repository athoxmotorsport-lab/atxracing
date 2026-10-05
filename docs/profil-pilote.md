# Profil pilote FR / EN

## Périmètre

- Identité Steam partagée entre ACC et ACE, vérifiée par `auth-steam` et `auth-session` existants.
- Nom public, équipe, numéro et avatar : données existantes conservées.
- Pseudo, jeux pratiqués / à découvrir, GT3 préférée (un modèle), jusqu'à trois circuits favoris et format favori : table privée `driver_profile_preferences`.
- Le formulaire est prérempli depuis le compte, puis depuis son éventuel brouillon local.
- Seuls le pseudo et le nom public sont requis. L'équipe vide s'affiche « Sans équipe » / « No team ».
- Les préférences sont communes au compte ; les historiques sportifs restent propres au jeu.
- La jauge ACC affiche le niveau `performance_class` déjà publié dans le classement général. Dans l’en-tête, seul le personnage du rang courant apparaît, sans répéter son nom à côté.
- Le Safe utilise la note `safety_score` et la classe `safety_class` déjà calculées dans `driver_ratings` (bronze à partir de 39, argent à partir de 60, or à partir de 80). Sans note, la jauge reste vide.
- Fast Driver et Gentleman Driver proviennent de la vue officielle `event_honours`. Fast Driver utilise le meilleur temps enregistré dans `results` pour chaque course ; Gentleman Driver classe les pénalités, puis les tours valides et la série de tours propres. Les emblèmes Safe, Fast Driver et Gentleman Driver sont dans l’en-tête du profil, à côté du personnage de niveau. Un « ? » signale une note ou une distinction absente. Un clic ouvre dans cet en-tête la jauge Safe ou le détail des courses (circuit, date, temps ou conduite, position d’arrivée publiée).
- Le niveau ACE et la régularité restent à définir. Aucun niveau ni récompense n'est attribué par le navigateur.

## Serveur

Source du schéma : `supabase/profile-schema.sql` (migration initiale `driver_profile_preferences_fr_en`) puis `supabase/profile-preferences-v2.sql` pour les nouvelles préférences. Source de la fonction : `supabase/functions/driver-profile/`.

La fonction n'utilise aucune dépendance tierce. Elle emploie les variables serveur existantes `ATX_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEYS` ou `SUPABASE_SERVICE_ROLE_KEY`, et `SESSION_SECRET`. Aucune clé privilégiée n'est placée dans les fichiers statiques.

`verify_jwt=false` est nécessaire : le système existant fournit un jeton Steam opaque, pas un JWT Supabase. Chaque requête valide le HMAC du jeton contre `auth_sessions`, refuse les sessions expirées/révoquées, puis obtient l'identifiant du pilote de cette session. L'identifiant envoyé par un client est ignoré. L'origine est limitée à celle du site existant.

`GET driver-profile` renvoie les champs du pilote connecté nécessaires au formulaire, ses préférences, sa note Safe et ses distinctions sur les événements publics. `POST driver-profile` valide les longueurs, les jeux, le numéro, le catalogue GT3, les trois circuits au maximum et le format puis appelle `save_driver_profile` pour enregistrer les champs publics et privés dans une seule transaction. La fonction SQL est `SECURITY INVOKER`, réservée à `service_role`. La table privée active RLS et n'accorde aucun accès direct à `anon` ou `authenticated`. La politique publique existante de `drivers` est inchangée.

Une panne ne supprime pas une session valide et ne devient jamais un message de sauvegarde réussie. Un refus 401 demande de se reconnecter. Les erreurs ne renvoient aucun détail de base de données.

## Validation

Tests de validation : débutant sans préférences, normalisation, champs sportifs injectés, catalogue GT3, circuits limités à trois et valeurs invalides.

Tests de fonction : session absente/expirée, origine incorrecte, identifiant falsifié, lecture limitée au compte, validation avant écriture, erreur de base.

Tests navigateur avec services simulés : visiteur, navigation directe entre les trois étapes, choix unique GT3/format, trois circuits au maximum, brouillon FR→EN, sauvegarde en échec puis réussie, jauges et distinctions, séparation ACE, affichage mobile, récupération après erreur temporaire, conservation du pilote public dans les liens de langue.

La connexion interactive réelle doit être faite par le détenteur du compte Steam. Les tests automatisés ne prouvent pas une connexion Steam réelle.

## Décisions toujours ouvertes

Seuils et attribution du niveau Challenger (absent du classement actuel) et formule de régularité. Une photo réelle de chaque GT3 pourra être ajoutée lorsque des captures officielles ou des images fournies avec droits d'utilisation seront disponibles ; le site n'affiche pas d'image de voiture inventée ou récupérée sans vérification.
