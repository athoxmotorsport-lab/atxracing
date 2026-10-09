# Championnats WGT

Les classements pilotes et équipes séparent WGT Sprint, WGT Endurance et WGT American Dream. Daily Race et ATX Series restent indépendants.

| Position | Sprint / American Dream | Endurance |
| --- | --- | --- |
| 1 | 25 | 50 |
| 2 | 18 | 36 |
| 3 | 15 | 30 |
| 4 | 12 | 24 |
| 5 | 10 | 20 |
| 6 | 8 | 16 |
| 7 | 6 | 12 |
| 8 | 4 | 8 |
| 9 | 2 | 4 |
| 10 | 1 | 2 |

Le bonus existant du meilleur tour reste de 2 points. American Dream est une compétition solo : les résultats et points individuels validés alimentent son classement, sans inscription d’équipage. Sprint et Endurance attribuent les points une seule fois par équipage ; chaque pilote participant reçoit ces mêmes points. Les équipages non identifiés restent sans points dans ces deux championnats jusqu’à leur identification. Seuls les résultats officiels alimentent les classements.

Dans l’administration, le champ « Championnat WGT » définit le classement de la course, indépendamment de son format. `events.championship_code` conserve cette affectation ; les changements de titre ne déplacent pas une course vers un autre classement. La publication du brouillon transmet ce champ dans la même transaction.

Les anciennes manches American Dream sont reconnues par leur nom, les Sprint et Endurance par leur format ou type d’épreuve. Une course WGT non identifiée ne rejoint aucun des trois classements. Le Collector continue à utiliser les codes courts WGT, DR et ATXS ; les sessions doivent être rapprochées de la course publiée pour récupérer son championnat.

Les URL/API utilisent WGT_SPRINT, WGT_ENDURANCE et WGT_AMERICAN_DREAM. Un ancien lien de classement `type=WGT` ouvre désormais Sprint. Ces identifiants ne sont pas des codes à ajouter aux noms de serveurs.
