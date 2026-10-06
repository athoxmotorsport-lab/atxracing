# Décisions produit ATXRACING — 6 octobre 2026

Ce document complète les documents historiques. En cas de contradiction sur les éléments ci-dessous, ces décisions sont prioritaires.

## Entrée et profil

- La première page demande une connexion Steam et ne comporte ni en-tête ni pied de page.
- Après vérification du Steam ID, un profil confirmé ouvre directement « Mon Paddock ».
- Un nouveau pilote ou un profil incomplet est dirigé vers le parcours de profil avant d'accéder au reste du site.
- Les informations ACC existantes sont retrouvées par l'identité Steam vérifiée et proposées à confirmation. Aucun second pilote ne doit être créé pour un Steam ID déjà connu.
- L'accompagnement est assuré par un « ingénieur de course » contextuel, pas par un chatbot. Il ne s'impose plus après confirmation du profil.
- « Mon Paddock » et ses deux cartes ACC / ACE sont conservés. La bannière historique à trois zones reste abandonnée.

## Navigation et identité visuelle

Le menu latéral comporte exactement : Compétitions, Classements, Circuits, Live & Replay, Règlement, Profil pilote et ATXRACING.

Le header regroupe le logo détouré, ACC / ACE, FR / EN, les notifications, les messages privés, le futur solde de Coins ATX et le profil. Le fond général fourni reste visible derrière des surfaces sombres semi-transparentes.

Le profil reprend la couleur du niveau publié : évaluation gris, Rookie cuivre, Challenger bleu, Pro rouge, Elite or et Alien violet. La couleur reste un accent visuel et ne modifie pas les données sportives.

## Formats confirmés

- Sprint 60 : course de 60 minutes, un arrêt réel obligatoire, stands ouverts, pneus et carburant facultatifs.
- Sprint 90 : course de 90 minutes, deux arrêts réels obligatoires, stands ouverts, pneus et carburant facultatifs.
- WGT Sprint : deux pilotes, course de 60 minutes et changement de pilote obligatoire.
- WGT Endurance : 1 à 6 pilotes et relais de 45 minutes maximum, y compris en solo. La durée et le nombre minimal d'arrêts dépendent de l'épreuve. Monza et Silverstone sont des épreuves distinctes du même principe d'endurance.

Un passage seul dans la voie des stands ne valide pas un arrêt réel.

## Voitures

Les photos génériques récupérées sur Internet doivent être remplacées par une série ATXRACING homogène : modèle reconnaissable, sans livrée d'équipe, peinture neutre, vue trois-quarts avant, fond transparent, sans texte ni nom intégré. Le nom du modèle reste une donnée de l'interface.

## Coins ATX

Le futur registre utilise des mouvements traçables et idempotents, jamais un solde modifié directement.

- Confirmation initiale du profil : +10.
- Inscription future depuis ATXRACING : -1.
- Course terminée : +1.
- Meilleur tour officiel : +1.
- Positions 1 à 10 : respectivement +10 à +1.

Le prélèvement d'inscription reste inactif tant que l'inscription est gérée par SimGrid. Les anciens profils confirmés recevront le crédit initial une seule fois lors de l'activation. Les récompenses sportives ne sont calculées que depuis des résultats officiels et reliés sans ambiguïté à une épreuve.

## Discord

Une publication explicite sur le site déclenchera automatiquement le message Discord correspondant. Un brouillon ne déclenche rien. Les envois doivent être dédupliqués, traçables et afficher un état envoyé, en attente ou échec.

## Référencement

Chaque page publique doit posséder une description, une URL canonique et les métadonnées de partage. Le dépôt publie `sitemap.xml` et `robots.txt`. Les pages privées, le panel admin, la messagerie et les profils personnels ne figurent pas dans le sitemap public.
