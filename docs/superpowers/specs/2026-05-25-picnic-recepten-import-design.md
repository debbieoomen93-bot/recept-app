# Design: Picnic Recepten Importeren

**Datum:** 2026-05-25  
**Status:** Goedgekeurd

---

## Doel

Gebruikers kunnen Picnic-recepten browsen en met één klik importeren als volledig bewerkbaar recept in de app, inclusief ingrediënten die al gekoppeld zijn aan Picnic-producten.

---

## Architectuur

### Nieuwe API-endpoints

**`api/picnic-recipes.js`**  
- Method: POST  
- Input: `{ authToken }`  
- Roept `client.recipe.getRecipesPage()` aan via de `picnic-api` npm package  
- Parseert de FusionPage-response om een lijst terug te geven van:  
  `{ id, name, imageUrl, prepTime, portions }`  
- Geeft 401 terug als token verlopen is

**`api/picnic-recipe-detail.js`**  
- Method: POST  
- Input: `{ authToken, recipeId }`  
- Roept `client.recipe.getRecipeDetailsPage(recipeId)` aan  
- Parseert de FusionPage-response naar:  
  `{ id, name, imageUrl, prepTime, portions, ingredients: [{ name, picnicProductId, picnicProductName, amount, unit }], steps: [string] }`  
- Geeft 401 terug als token verlopen is

### Nieuwe frontend-componenten

**`src/components/PicnicRecipes.jsx`**  
- Toont een grid van receptkaarten (afbeelding + naam + bereidingstijd + porties)  
- Laadt recepten bij mount via `/api/picnic-recipes`  
- Bij klikken op een kaart: navigeer naar detailpagina  
- Toont foutmelding als auth token ontbreekt/verlopen is

**`src/components/PicnicRecipeDetail.jsx`**  
- Toont details van één Picnic-recept: afbeelding, naam, ingrediënten, stappen  
- "Importeer als recept"-knop onderaan  
- Bij importeren: sla op in Firebase via bestaande `createRecipe()` functie  
- Na opslaan: navigeer naar `/recepten` (receptenlijst)

### Routing

Nieuwe routes in `App.jsx`:  
- `/picnic` → `PicnicRecipes`  
- `/picnic/:recipeId` → `PicnicRecipeDetail`

### Navigatie

Nieuwe tab "🚲 Picnic" in de bestaande navigatiebalk naast de huidige tabs.

---

## Data flow

```
Gebruiker opent /picnic
  → PicnicRecipes haalt authToken op uit localStorage
  → POST /api/picnic-recipes { authToken }
  → Vercel serverless → picnic-api npm package → Picnic API
  → Response: lijst van recepten
  → Grid getoond

Gebruiker klikt op recept
  → Navigeer naar /picnic/:recipeId
  → POST /api/picnic-recipe-detail { authToken, recipeId }
  → Response: volledige receptdata
  → Toont ingrediënten + stappen

Gebruiker klikt "Importeer"
  → createRecipe(data, username) naar Firebase
  → Navigate('/recepten')
```

---

## Auth-afhandeling

- Beide API-endpoints controleren of het token geldig is  
- Bij 401-response: toon melding "Je Picnic-sessie is verlopen. Zoek een ingrediënt om opnieuw in te loggen."  
- Geen nieuwe login-flow in dit scherm (hergebruik bestaande flow via IngredientNameInput)

---

## Buiten scope

- Eigen recepten pushen naar Picnic als "maaltijdplanning"  
- Favorieten opslaan in Picnic  
- Paginering van de receptenlijst (Picnic toont standaard ~12 recepten)  
- Categorie-veld op geïmporteerde ingrediënten (al verborgen in formulier)

---

## Aandachtspunten implementatie

- De FusionPage-response van Picnic is een geneste structuur. De npm package heeft parsers voor de catalogus, maar niet specifiek voor recepten. Tijdens implementatie: eerst de ruwe response inspecteren en parsers aanpassen.  
- `prepTime` en `portions` kunnen op verschillende plekken in de FusionPage zitten — fallback naar null als niet gevonden.  
- Ingrediënten uit Picnic-recepten bevatten een `sellingUnit` die direct te gebruiken is als `picnicProductId`.
