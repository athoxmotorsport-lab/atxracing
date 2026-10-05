# Messages privés entre pilotes

Les pilotes connectés avec Steam disposent d'une messagerie commune à ACC et ACE, accessible depuis l'enveloppe de l'en-tête. Ils peuvent rechercher un profil public, envoyer un message, consulter les échanges, voir le nombre de messages non lus et bloquer ou débloquer un pilote. Le volet Discord reste indépendant : il affiche le widget du serveur et ses membres en ligne.

Les données sont stockées dans `driver_messages` et `driver_message_blocks` par la migration `20261005195025_driver_private_messages.sql`. La lecture et l'écriture directes des tables sont interdites aux rôles navigateur. La fonction `driver-messages` vérifie la session Steam côté serveur et limite chaque requête aux échanges du pilote connecté. L'envoi est limité à cinq messages par minute et cent par jour. Les messages sont du texte brut de 2 000 caractères maximum, sans pièce jointe ni chiffrement de bout en bout.

L'interface FR/EN a été testée avec des réponses simulées, notamment l'envoi et le blocage. Une vérification en conditions réelles avec deux comptes Steam reste à faire. Aucune présence en ligne propre au site n'est annoncée : la liste des membres en ligne vient du widget Discord.
