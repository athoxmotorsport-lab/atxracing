# Test d’inscription ATX Series et connexion ACC

Le catalogue initial comprend dix GT3 : Aston Martin V8 Vantage, Honda NSX Evo, Mercedes-AMG Evo 2020, BMW M4, Audi R8 Evo II, Ferrari 296, Lamborghini Huracán Evo2, Porsche 992, McLaren 720S Evo et Ford Mustang. Les pilotes choisissent un seul modèle, avec une vignette et son nom, parmi les voitures qu’ils possèdent dans ACC. Le site ne peut pas vérifier la possession des DLC.

Les IDs ACC sont recoupés avec [ACCWeb — cars.js](https://github.com/assetto-corsa-web/accweb/blob/master/public/src/data/cars.js). Attention aux versions : Honda Evo = 21, Mercedes-AMG 2020 = 25, Porsche 992 = 34 et McLaren Evo = 35. Les images sont les illustrations ATX existantes, réduites en vignettes ; l’image Mercedes est l’illustration AMG déjà disponible. Les IDs sont enregistrés dans la base et exportés en `forcedCarModel`, sans déduction à partir du nom.

1. Dans **Administration ATX Racing**, créer une course ATX Series de test avec une date future et le circuit du serveur, puis enregistrer et publier. La publication ouvre les inscriptions sur le site. Le format est 2 minutes d’essais, 15 minutes de qualifications et 45 minutes de course.
2. Chaque pilote se connecte avec Steam, confirme son profil, ouvre la course et renseigne ses noms ACC, initiales, numéro et voiture. Tester avec deux comptes Steam distincts et deux voitures différentes.
3. Dans **Inscriptions et entry lists ACC**, sélectionner la course, fermer les inscriptions lorsque la grille est prête, puis exporter **JSON**. Le CSV sert au suivi ; ACC attend `entrylist.json`.
4. Dans le dossier de configuration du serveur dédié de test, installer le JSON sous le nom `entrylist.json`. Vérifier le chemin utilisé par votre gestionnaire de serveur, le circuit et la version ACC, puis redémarrer le serveur pour qu’il recharge sa configuration. Le fichier porte `forceEntryList: 1` : seuls les comptes Steam inscrits sont autorisés. Un administrateur qui souhaite rouler doit aussi s’inscrire.
5. Chaque pilote sélectionne dans ACC exactement la voiture inscrite. Vérifier l’accès, le numéro, les noms et la présence des deux pilotes. Tester aussi qu’un compte non inscrit est refusé. En cas de refus, relever le message du jeu et le journal du serveur, puis vérifier Steam ID, modèle et version ACC.

La fermeture des inscriptions masque le formulaire et bloque les opérations d’inscription sur le site. Exporter de nouveau et remplacer le fichier si la grille change après une réouverture ; le fichier serveur ne se synchronise pas automatiquement avec le site.

Les tests automatisés couvrent sélection unique FR/EN sur mobile, miniature chargée, inscription, retrait, export du modèle sélectionné, identités Steam vérifiées, isolation SimGrid et capacité. Un test transactionnel Supabase crée des données synthétiques et les annule. La connexion depuis le jeu et le chargement du fichier par votre serveur doivent encore être validés lors du test réel.
