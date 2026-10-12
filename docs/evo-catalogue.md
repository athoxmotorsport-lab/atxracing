# Assetto Corsa EVO — catalogue officiel consulté le 12 octobre 2026

Source : https://assettocorsa.gg/assetto-corsa-evo/

Catalogue affiché sur le site officiel. La présence dans ce catalogue ne garantit pas la disponibilité dans la version installée : vérifier les notes de version avant activation des inscriptions.

## Voitures routières (50)

- Abarth 695 Biposto (2022)
- Alfa Romeo 75 1.8 Turbo Evoluzione (1987)
- Alfa Romeo Giulia GTAm (2021)
- Alfa Romeo Junior Elettrica Veloce (2024)
- Alpine A110 S (2020)
- Alpine A290_β (2023)
- Audi RS 3 Sportback (2022)
- Audi R8 V10 performance quattro
- Audi Sport quattro (1983)
- BMW M3 E46 CSL (2003)
- Audi RS 6 Avant
- BMW M2 Coupe (G87)
- BMW M4 CSL G82 (2022)
- BMW M8 Competition (2022)
- BMW M3 Sport Evo (E30)
- Caterham 485 CSR
- Chevrolet Camaro ZL1 (2022)
- Dallara EXP
- Dallara Stradale
- Ferrari 288 GTO
- Ferrari 296 GTB (2021)
- Ferrari Daytona SP3 (2021)
- Ford Escort RS Cosworth (1994)
- Honda NSX-R (1992)
- Honda S-2000 (2003)
- Hyundai i30 N Hatchback (2021)
- Lamborghini Countach
- Lamborghini Huracán STO (2021)
- Lancia Delta HF Integrale “Evoluzione 2” (1993)
- Lotus Emira (2021)
- Lotus Exige V6 Cup (2014)
- Mazda MX-5 NA (1994)
- Mazda RX-7 FD
- Mini John Cooper S Mk VI (1990)
- Mercedes-Benz 190E AMG 2.5-16 Evo II
- Nissan Datsun 240Z (S30)
- Nissan Datsun 240Z (S30) – Tuned
- Porsche 718 Cayman GT4 RS (2024)
- Porsche 911 Turbo 3.6 [964] (1993)
- Porsche 911 (992) GT3 RS
- Peugeot 205 T16 (1984)
- Renault 5 GT Turbo (1990)
- Toyota AE86
- Toyota AE86 Tuned
- Toyota GR86 (2024)
- Toyota Supra Turbo RZ (1998)
- Toyota Supra Turbo RZ V2 DRIFT
- Volkswagen Golf 8 GTI Clubsport (2022)
- Volkswagen Golf 8 R
- Volkswagen Golf GTI MK1

## Voitures de course (24)

- Alfa Romeo Giulia Sprint GTA (1965)
- Audi R8 LMS GT2
- Audi R8 LMS GT3 Evo II
- Audi R8 LMS GT4 Evo
- BMW M4 GT3 EVO
- BMW M2 CS Racing (2020)
- Caterham Seven Academy Racer
- Ferrari 296 GT3
- Ferrari 488 Challenge Evo (2021)
- Ferrari F40 LM (1993)
- Ferrari F2004
- Ferrari SF-25 (2025)
- Ford Mustang GT3
- KTM X-BOW GT2
- KTM X-BOW GT4
- Lamborghini Huracán Super Trofeo EVO2
- Maserati GT2 (2023)
- Mazda MX5 ND Cup (2017)
- Mercedes-AMG GT2 (2023)
- Porsche 718 Cayman GT4 Clubsport
- Porsche 935
- Porsche 911 GT3 Cup [992] (2021)
- Porsche 991II GT2 RS Clubsport Evo
- Porsche 992 GT3 R Rennsport

## Circuits (19)

- Bathurst
- Brands Hatch
- Circuit of the Americas
- Donington Park
- Fuji Speedway
- Imola
- Kyalami
- Laguna Seca
- Monza
- Nürburgring (GP, Sprint, 24h)
- Nordschleife (Standard, Touristenfahrten)
- Oulton Park (GP, Fosters)
- Paul Ricard
- Red Bull Ring
- Road Atlanta
- Sebring
- Spa-Francorchamps
- Suzuka
- Watkins Glen

## Images à préparer

Voitures : carrosserie blanche, sans livrée ni texte, vue trois quarts avant, fond transparent, miniature WebP légère. Les modèles EVO différents des modèles ACC nécessitent leur propre image (BMW M4 GT3 EVO notamment).

Circuits : utiliser les images de lieux déjà disponibles pour les circuits communs, avec le cadre aux couleurs du pays ; compléter les circuits manquants à partir de références vérifiées. Une image générée est une illustration, pas une capture du jeu.

## Préparation pour ATXRACING

Le catalogue structuré est conservé dans `data/evo-catalogue.json`, avec une clé stable par modèle, la catégorie routière/course, la provenance et le chemin du visuel. Les identifiants de voitures ACC ne sont pas utilisés pour EVO : les identifiants serveur et la disponibilité devront être vérifiés sur la version EVO utilisée.

Les créations blanches détourées sont dans `media/evo/cars/`, avec leurs miniatures 360 × 200 dans `thumbs/`. Seuls les modèles identiques déjà illustrés sont réutilisés depuis le catalogue ACC. Les photos de circuits existantes sont conservées ; les six illustrations de lieux manquants sont marquées comme telles.

Le catalogue est rendu statiquement en FR/EN dans les pages EVO Compétitions (voitures) et Circuits. Chaque miniature se charge à la demande, avec ses dimensions déclarées. Aucune requête Supabase n’est nécessaire pour consulter ce catalogue. Les inscriptions, résultats et classements EVO restent à préparer une fois le jeu et son collecteur validés.
