# Deployment instructies

## Vereisten

- GitHub account (repo aangemaakt)
- Vercel account (gratis)
- Firebase project (Blaze plan — pay-as-you-go, praktisch gratis bij thuisgebruik)
- Google Cloud project met Vertex AI API ingeschakeld

---

## Stap 1 — Firebase project instellen

1. Ga naar https://console.firebase.google.com
2. Maak een nieuw project (of gebruik je bestaande Google Cloud project)
3. Schakel in:
   - **Firestore Database** (productie-modus, regio: europe-west4)
   - **Storage** (standaard bucket)
   - **Functions** (vereist Blaze plan)
4. Ga naar Project Settings → Algemeen → Jouw apps → Web-app toevoegen
5. Kopieer de Firebase config (apiKey, authDomain, etc.)

## Stap 2 — Vertex AI inschakelen

1. Ga naar https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
2. Selecteer jouw Firebase project
3. Klik **Enable**

## Stap 3 — Firebase project ID invullen

Vervang in `.firebaserc`:
```json
"default": "<REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID>"
```
met jouw echte Firebase project ID (bijv. `recept-app-12345`).

## Stap 4 — Deployen naar Vercel

1. Push de code naar GitHub:
   ```bash
   git remote add origin https://github.com/<jouw-username>/recept-app.git
   git push -u origin main
   ```

2. Ga naar https://vercel.com/new
3. Importeer de GitHub repo
4. Stel environment variables in (Settings → Environment Variables):
   ```
   VITE_FIREBASE_API_KEY         = <waarde uit Firebase Console>
   VITE_FIREBASE_AUTH_DOMAIN     = <project-id>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID      = <project-id>
   VITE_FIREBASE_STORAGE_BUCKET  = <project-id>.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID = <waarde>
   VITE_FIREBASE_APP_ID          = <waarde>
   VITE_SHARED_PASSWORD          = <gekozen wachtwoord>
   ```
5. Klik **Deploy** — Vercel bouwt en deployt automatisch

## Stap 5 — Firebase Cloud Functions deployen

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only functions
```

De `generateRecipeImage` function is nu actief. Zodra je een nieuw recept toevoegt, genereert de function automatisch een AI-afbeelding (duurt ~20-30 seconden).

## Stap 6 — Firestore en Storage regels instellen

In Firebase Console:

**Firestore rules** (Database → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Storage rules** (Storage → Rules):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recipe-images/{imageId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Klaar!

De app is live op jouw Vercel-URL. Deel die URL (+ het gedeelde wachtwoord) met je partner.

Toekomstige updates: push naar `main` → Vercel deployt automatisch.
