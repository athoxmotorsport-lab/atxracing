# Compétitions et inscriptions ACC

Les pages françaises et anglaises distinguent World GT Sprint et Endurance. Daily Race accepte les formats `DR` (60 minutes, un arrêt) et `DR_90` (90 minutes, deux arrêts), tous deux rattachés au classement `DR`. Les pneus et le carburant restent facultatifs. ATX Series utilise le code de classement `ATXS`, avec 2 minutes d’essais, 15 minutes de qualifications et 45 minutes de course.

## Préparer un programme

Dans l’administration, cliquer sur « Nouveau programme ATX Series », choisir la première date en heure de Bruxelles, puis renseigner un circuit par ligne dans « Programme ATX Series ». Le générateur prépare jusqu’à 24 brouillons espacés de 90 minutes. Vérifier les descriptions FR/EN, l’affiche et la capacité, enregistrer puis publier chaque rendez-vous. Il ne publie pas automatiquement des jours ou des horaires encore indéfinis et ne démarre pas les serveurs ACC.

ATX Series ne demande aucun lien SimGrid ; les inscriptions sur le site sont activées à la publication. Pour une autre course publique, utiliser « Activer les inscriptions sur le site » dans le panneau des entry lists. Éviter d’ouvrir simultanément deux systèmes d’inscription pour la même course.

## Voitures et pilotes

Renseigner dans le catalogue le nom et l’identifiant numérique officiel du modèle ACC utilisé par le serveur. Les identifiants 35/36 des fichiers exemples ne permettent pas, seuls, de déduire un nom de voiture ; aucun catalogue approximatif n’est ajouté. Sans catalogue, le formulaire explique que l’organisateur prépare les voitures.

Chaque pilote doit avoir une connexion Steam validée et un profil confirmé. Le formulaire recueille les noms et initiales ACC, le numéro de voiture, le modèle et éventuellement l’équipe. Le Steam ID provient exclusivement de l’identité vérifiée côté serveur. Pour rejoindre une voiture WGT, le capitaine partage le code privé de son inscription ; chaque équipier se connecte et s’inscrit lui-même. Maximum deux pilotes en Sprint, six en Endurance. Le capitaine ne peut retirer la voiture tant que d’autres membres y sont inscrits.

La capacité est comptée en voitures. Les modifications sont sérialisées par verrouillage de l’événement : numéro unique, une inscription par pilote et par événement, aucune inscription après la fermeture ou le début des sessions. Les inscriptions sont aussi synchronisées dans `registrations` pour les compteurs publics existants.

## Exporter

Dans l’administration, sélectionner la course puis télécharger CSV ou JSON. Le CSV contient une ligne par pilote. Le JSON utilise `entries`, `drivers`, les Steam IDs préfixés par `S` et `forceEntryList: 1`, comme les exemples solo/équipe fournis. Un Sprint incomplet à un pilote bloque l’export. L’export est réservé à un compte administrateur valide, jamais aux pages publiques.

Le JSON fixe les catégories ACC et nationalités à 0 (valeur non spécifiée), sans conversion des niveaux sportifs ATX, et conserve ballast/restrictor à 0, grille à -1 et droits serveur à 0. Les noms ACC sont privés ; les pages publiques conservent le pseudo pilote. Le CSV protège les cellules contre les formules de tableur.

Les Coins ATX ne sont pas débités par cette fonctionnalité. Elle n’automatise pas le lancement d’un serveur, le chargement de l’entry list ou le rapprochement des résultats Collector : chaque événement publié porte cependant son code de compétition pour les classements.

## Déploiement et vérification

Appliquer, dans l’ordre, `20261007120000_site_registration.sql` puis `20261007121000_competition_formats.sql`. Déployer `race-registration`, `atx-event-admin` et `public-event` avec la configuration JWT du dépôt (authentification Steam interne). La nouvelle fonction réutilise `SESSION_SECRET`, `ATX_SITE_URL` et les clés Supabase privées déjà configurées.

Vérifications : build + `scripts/verify_site.py`, `node --test scripts/test-registration.mjs`, `node --experimental-strip-types --test scripts/test-admin.mjs`, et `CHROME_PATH=/usr/bin/chromium node scripts/test-registration-browser.cjs`. `scripts/test-registration.sql` doit être exécuté dans une transaction suivie de `ROLLBACK`; il crée uniquement des identités fictives et vérifie capacité, doublons, équipages, désinscription et publication des formats.

Les anciennes URL `ballade.html` redirigent vers ATX Series ; les résultats et événements historiques ne sont pas supprimés.
