# Parcours pilote, résultats et Coins ATX

Les versions française et anglaise proposent les mêmes fonctions. L’entrée Steam conserve son écran sans header ni footer. Mon paddock reste personnel, avec les deux cartes ACC et ACE et un tableau de bord : inscriptions synchronisées, prochain rendez-vous, dernier résultat officiel et portefeuille.

## Résultats

Les quatre Daily Race historiques conservent leur statut officiel. Hotlaps, entraînements et open lobbies ne figurent pas dans les archives de courses, le dernier résultat ou les statistiques de compétition. Leurs chronos peuvent alimenter les meilleurs tours et le rythme selon les références ACC existantes.

Dans **Administration ATX Racing → Validation des résultats**, sélectionner une course puis consulter ses résultats. Chaque correction exige un motif public FR et EN. Les positions, statuts et points peuvent être corrigés ; une correction remet le résultat en examen et conserve les valeurs avant/après dans un journal. Publier **Officiel** uniquement après vérification. La validation officielle est bloquée pendant un import en cours. Un import Collector ultérieur remet les résultats en provisoire et retire les récompenses dépendant de l’ancienne publication. Les points du classement proviennent uniquement des résultats officiels. Les imports et données sources ne sont pas supprimés par le nouveau parcours.

Le Collector conserve les codes courts **WGT**, **DR** et **ATXS** dans les noms de serveur. Le rapprochement avec les courses publiées utilise le code de compétition, le circuit et l’horaire de session. Les courses récurrentes sont distinguées par leur horaire ; un horaire manquant ou ambigu ne permet pas un rapprochement automatique. Aucun code supplémentaire n’est demandé. Les titres et horaires éditoriaux sont conservés.

La publication est refusée sans résultats, avant la durée minimale prévue, ou en présence de positions classées manquantes/en doublon en solo. Les WGT exigent l’association des pilotes à un équipage ; leur barème de points existant continue à être calculé par équipage. Les capitaines donnent un nom distinct à chaque voiture WGT.

## Coins

- 10 Coins de bienvenue par compte ayant réellement validé une connexion Steam, sans doublon ; les comptes déjà connectés reçoivent également ce crédit.
- Une nouvelle inscription sur le site coûte 1 Coin par pilote ; les inscriptions SimGrid ne sont pas débitées.
- Aucun débit pendant l’attente. Le débit intervient lors de la confirmation effective.
- Désinscription avant le départ : remboursement de la participation payée, même lorsque les nouvelles inscriptions sont fermées. Un capitaine ne peut pas retirer une voiture avec des coéquipiers encore inscrits.
- Résultat officiel classé, avec des tours complétés : remboursement du Coin de participation payé et non déjà remboursé.
- Top 10 officiel : 10, 9, 8, 7, 6, 5, 4, 3, 2 et 1 Coins. Meilleur tour des pilotes classés : 1 Coin, y compris en cas d’égalité.
- Récompenses historiques calculées sur les Daily Race officielles pour les profils associés à une connexion Steam vérifiée, y compris lorsqu’un pilote revendique plus tard son historique en se connectant. Les anciennes inscriptions n’ayant jamais été facturées ne produisent pas un remboursement fictif.

Le registre est privé et append-only du point de vue de l’application. Republier un même résultat ne paie pas deux fois. Les modifications sportives ajoutent des compensations, ce qui peut réduire le solde si des récompenses antérieures ont déjà été utilisées. Le solde du header mène à l’historique du profil. L’interface montre les 100 derniers mouvements ; le solde tient compte de tous les mouvements.

## Liste d’attente

La capacité correspond à des voitures, pas au nombre de coéquipiers. Lorsque la grille est pleine, une demande rejoint la file sans frais. La première demande reçoit une réservation de 30 minutes lorsqu’une place se libère. La réservation peut être confirmée depuis la fiche course ou Mon paddock ; elle expire au plus tard au départ. Une réservation expirée libère la place pour la demande suivante lors du prochain accès au parcours. Les réservations actives empêchent un nouvel arrivant de prendre la place. Les invitations rejoignent une voiture existante et gardent leurs limites d’équipage.

Les offres sont visibles dans Mon paddock et la fiche course. Aucune notification par email ou Discord n’est envoyée par ce parcours.

## Progression et préférences

Le profil accepte plusieurs formats simultanément : Sprint 60, Sprint 90 et Endurance. Les choix antérieurs sont conservés. Les objectifs par circuit réutilisent les références du classement ACC et visent le chrono strictement inférieur au seuil suivant : 108, 106, 104 ou 102 %. Le niveau global dépend de la moyenne des circuits ; atteindre un objectif sur un circuit ne garantit pas à lui seul un changement du niveau global.

## Pages publiques et partage

Compétitions, calendrier, circuits, classements, règlement, Live & Replay et présentation sont consultables sans Steam. Inscription, portefeuille, paddock, administration et messagerie restent authentifiés. Un pilote nouvellement connecté doit toujours confirmer son profil. Après connexion/confirmation, la course consultée peut être reprise.

La nouvelle image Open Graph/Twitter est `share-atxracing-v2.jpg` (1200 × 630), commune au site. Les services de partage peuvent conserver leur ancienne miniature en cache.

`data/public-events.json` contient uniquement des métadonnées publiques. `scripts/sync-public-events.py` actualise ce snapshot ; `build.py` génère les pages FR/EN `/acc/races/<slug>.html`, leurs titres, descriptions, liens canoniques, données SportsEvent et entrées sitemap. Le workflow **Refresh public race pages** programme une actualisation horaire et permet une exécution manuelle. Une course nouvellement publiée reste consultable immédiatement via sa fiche dynamique ; sa page statique SEO apparaît au prochain passage du workflow. Google décide du délai d’indexation.

## Vérification

Les tests SQL `scripts/test-registration.sql` et `scripts/test-paddock.sql` utilisent des comptes synthétiques et doivent être exécutés dans une transaction terminée par `ROLLBACK`. Ils couvrent équipages, capacité, file, réservations, expirations, débits/remboursements, identité privée, validation, corrections et non-duplication des récompenses. Les tests navigateur FR/EN contrôlent le parcours mobile. Les essais en jeu ACC restent nécessaires pour les nouveaux formats d’équipage.
