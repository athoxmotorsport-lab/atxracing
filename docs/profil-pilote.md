# Profil pilote FR / EN

## Périmètre

- Identité Steam partagée entre ACC et ACE, vérifiée par `auth-steam` et `auth-session` existants.
- Nom public, équipe, numéro et avatar : données existantes conservées.
- Pseudo, jeux pratiqués / à découvrir et GT3 préférée : table privée `driver_profile_preferences`.
- Le formulaire est prérempli depuis le compte, puis depuis son éventuel brouillon local.
- Seuls le pseudo et le nom public sont requis. L'équipe vide s'affiche « Sans équipe » / « No team ».
- Les préférences sont communes au compte ; les historiques sportifs restent propres au jeu.
- Aucune attribution de niveau, de Safe, de régularité ou de récompense n'est déclenchée.

## Serveur

Source du schéma : `supabase/profile-schema.sql` (migration distante `driver_profile_preferences_fr_en`). Source de la fonction : `supabase/functions/driver-profile/`.

La fonction n'utilise aucune dépendance tierce. Elle emploie les variables serveur existantes `ATX_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEYS` ou `SUPABASE_SERVICE_ROLE_KEY`, et `SESSION_SECRET`. Aucune clé privilégiée n'est placée dans les fichiers statiques.

`verify_jwt=false` est nécessaire : le système existant fournit un jeton Steam opaque, pas un JWT Supabase. Chaque requête valide le HMAC du jeton contre `auth_sessions`, refuse les sessions expirées/révoquées, puis obtient l'identifiant du pilote de cette session. L'identifiant envoyé par un client est ignoré. L'origine est limitée à celle du site existant.

`GET driver-profile` renvoie uniquement les champs du pilote connecté nécessaires au formulaire et ses préférences. `POST driver-profile` valide les longueurs, les jeux et le numéro puis appelle `save_driver_profile` pour enregistrer les champs publics et privés dans une seule transaction. La fonction SQL est `SECURITY INVOKER`, réservée à `service_role`. La table privée active RLS et n'accorde aucun accès direct à `anon` ou `authenticated`. La politique publique existante de `drivers` est inchangée.

Une panne ne supprime pas une session valide et ne devient jamais un message de sauvegarde réussie. Un refus 401 demande de se reconnecter. Les erreurs ne renvoient aucun détail de base de données.

## Validation

Tests de validation : débutant sans préférences, normalisation, champs sportifs injectés, valeurs invalides.

Tests de fonction : session absente/expirée, origine incorrecte, identifiant falsifié, lecture limitée au compte, validation avant écriture, erreur de base.

Tests navigateur avec services simulés : visiteur, parcours complet, retour entre étapes, brouillon FR→EN, sauvegarde en échec puis réussie, séparation ACE, affichage mobile, récupération après erreur temporaire, conservation du pilote public dans les liens de langue.

La connexion interactive réelle doit être faite par le détenteur du compte Steam. Les tests automatisés ne prouvent pas une connexion Steam réelle.

## Décisions toujours ouvertes

Rendu de l'illustration pour chaque niveau, seuils de rythme, formule de régularité et Safe, barèmes et récompenses. L'image complète apparaît comme légende des niveaux sans niveau attribué ; cette présentation peut être ajustée après validation.
