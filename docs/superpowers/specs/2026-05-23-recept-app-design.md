# Recept App — Design Spec

**Datum:** 2026-05-23  
**Status:** Goedgekeurd  
**Gebruikers:** Debbie + partner (thuisgebruik)

---

## Doel

Een gedeelde web-app waarmee twee gebruikers hun eigen recepten bijhouden, een weekmenu samenstellen en met één klik de boodschappen naar Picnic sturen. Nieuwe recepten krijgen automatisch een AI-gegenereerde afbeelding via Vertex AI Imagen.

---

## Tech Stack

| Component | Technologie | Kosten |
|-----------|------------|--------|
| Frontend | React (Vite) op Vercel | Gratis |
| Database | Firebase Firestore | Gratis (Spark plan) |
| Picnic-integratie | Vercel serverless function | Gratis |
| AI-afbeeldingen | Firebase Cloud Function → Vertex AI Imagen | ~€0.02/afbeelding |
| Authenticatie | Gedeeld wachtwoord als Vercel env var | — |

---

## Authenticatie

Eén gedeeld wachtwoord opgeslagen als Vercel environment variable (`SHARED_PASSWORD`). De gebruiker voert het eenmalig in; het wordt opgeslagen in `localStorage`. Geen echte accounts of sessies nodig.

---

## Datamodel (Firestore)

### `recipes/{id}`
```
title:       string
description: string
ingredients: [{ name: string, amount: number, unit: string, category: string }]
steps:       [string]
portions:    number
imageUrl:    string | null        // null totdat Cloud Function klaar is
imageStatus: 'pending' | 'done' | 'error'
createdBy:   string               // "Debbie" of naam partner
createdAt:   timestamp
updatedAt:   timestamp
```

### `weekplanning/{jaar-weeknummer}`
```
// bijv. document ID: "2026-21"
days: {
  maandag:  { recipeId: string | null, spans2Days: boolean }
  dinsdag:  { recipeId: string | null, spans2Days: boolean }
  woensdag: { recipeId: string | null, spans2Days: boolean }
  donderdag:{ recipeId: string | null, spans2Days: boolean }
  vrijdag:  { recipeId: string | null, spans2Days: boolean }
  zaterdag: { recipeId: string | null, spans2Days: boolean }
  zondag:   { recipeId: string | null, spans2Days: boolean }
}
// spans2Days op dag X betekent: de UI toont dag X+1 automatisch met hetzelfde recept
// en een "2e dag" badge. Dag X+1 in Firestore blijft { recipeId: null, spans2Days: false }.
// Porties: de planning gebruikt altijd het standaard portieaantal van het recept (v1).
}
```

---

## Schermen

### 1. Login
- Wachtwoordveld, bij juist wachtwoord opgeslagen in `localStorage`
- Toont app pas na correcte invoer

### 2. Recepten (overzicht)
- Lijst van alle recepten gesorteerd op naam
- Zoekbalk (client-side filter op titel)
- Elke kaart toont: AI-afbeelding (of spinner als nog pending), titel, aantal porties, naam auteur
- FAB (+) om nieuw recept toe te voegen

### 3. Recept toevoegen / bewerken
- Velden: titel, omschrijving, ingrediënten (naam + hoeveelheid + eenheid + categorie uit vaste lijst, dynamisch toevoegbaar), bereidingsstappen, aantal porties
- Na opslaan: recept direct in Firestore met `imageStatus: 'pending'`
- Firebase Cloud Function pikt het op en genereert afbeelding asynchroon

### 4. Recept detail
- AI-afbeelding bovenaan (of laadspinner als pending)
- Ingrediëntenlijst, stappen
- Knop "Toevoegen aan week" → opent dagkiezer

### 5. Weekplanning
- 7-daagse weergave (ma–zo), navigatie naar vorige/volgende week
- Per dag: gekoppeld recept of "+" om te kiezen
- Als `spans2Days: true`: dag erna toont hetzelfde recept met "2e dag" badge (automatisch, niet apart in te stellen — de vlag staat op de eerste dag)
- Onderaan: knop "Genereer boodschappenlijst"

### 6. Boodschappenlijst
- Gegenereerd vanuit weekplanning: alle ingrediënten van geselecteerde recepten samengevoegd (zelfde ingrediënt + zelfde eenheid → hoeveelheden opgeteld)
- Gegroepeerd per categorie (categorie is een vast veld per ingrediënt in het recept)
- Vinkjes om al-aanwezige items te markeren (lokale state, niet opgeslagen)
- Groene "Verstuur naar Picnic" knop onderaan

---

## AI Afbeeldingen — Flow

1. Gebruiker slaat nieuw recept op
2. Firestore document aangemaakt met `imageStatus: 'pending'`, `imageUrl: null`
3. Firebase Cloud Function triggered op `onCreate` van `recipes/{id}`
4. Function roept Vertex AI Imagen aan met prompt: `"Food photography of {title}, {description}, appetizing, professional"`
5. Gegenereerde afbeelding opgeslagen in Firebase Storage
6. Firestore document bijgewerkt: `imageUrl: <storage-url>`, `imageStatus: 'done'`
7. React app luistert via Firestore `onSnapshot` → afbeelding verschijnt automatisch

Bij fout: `imageStatus: 'error'`, app toont een standaard placeholder emoji.

---

## Picnic Integratie — Flow

1. Eerste gebruik: app vraagt om Picnic e-mailadres + wachtwoord via modal, opgeslagen in `localStorage`
2. Gebruiker klikt "Verstuur naar Picnic"
3. Frontend stuurt `POST /api/picnic-add` naar Vercel serverless function met de ingrediëntenlijst
4. Function logt in bij Picnic (inofficiële API), zoekt elk ingrediënt op, voegt beste match toe aan winkelmandje
5. Response: lijst van wat gelukt/mislukt is
6. Gebruiker opent Picnic-app en vindt mandje klaar

**Beperking:** Picnic-API is inofficieel en kan veranderen bij app-updates. Fallback: de app toont altijd de volledige boodschappenlijst zodat de gebruiker handmatig kan bestellen.

---

## Foutafhandeling

| Situatie | Gedrag |
|----------|--------|
| Vertex AI timeout / fout | `imageStatus: 'error'`, placeholder emoji getoond |
| Picnic login mislukt | Foutmelding, credentials opnieuw invoeren |
| Picnic product niet gevonden | Overgeslagen, app toont welke items niet toegevoegd zijn |
| Firestore offline | React toont cached data, wijzigingen gesynchroniseerd zodra verbinding terug is |

---

## Niet in scope (v1)

- Recepten importeren van externe URL
- Voedingswaarden bijhouden
- Albert Heijn integratie (Picnic-only voor v1)
- Push notificaties
- Afbeeldingen opnieuw genereren na bewerking
